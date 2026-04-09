const Quotation = require('../models/Quotation');
const User = require('../models/User');
const Destination = require('../models/Destination');

exports.getStats = async (req, res) => {
    try {
        const totalQuotations = await Quotation.countDocuments();
        const totalRevenue = await Quotation.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const byStatus = await Quotation.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    revenue: { $sum: '$total' }
                }
            }
        ]);

        const byDestination = await Quotation.aggregate([
            { $group: { _id: '$destination', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalQuotations,
                totalRevenue: totalRevenue[0]?.total || 0,
                byStatus,
                topDestinations: byDestination
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.exportCSV = async (req, res) => {
    try {
        const quotes = await Quotation.find().sort('-createdAt');
        const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;

        let csv = 'Date,Ref ID,Destination,Agent,Adults,Children,Total,Status,Hotels,Services\n';

        quotes.forEach(q => {
            const date = new Date(q.createdAt).toISOString().split('T')[0];
            const hotelsStr = (q.hotels || []).map(h => `${h.hotel}(${h.city},${h.nights}nts)`).join('; ');
            const svcsStr  = (q.services || []).map(s => `${s.type}(day${s.day},${s.rate}USD)`).join('; ');
            csv += `${date},${esc(q.refId)},${esc(q.destination)},${esc(q.userName || q.staff?.sales)},${q.pax.adults},${q.pax.children},${q.total.toFixed(2)},${q.status},${esc(hotelsStr)},${esc(svcsStr)}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('quotations_export.csv');
        return res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.exportCatalog = async (req, res) => {
    try {
        const dests = await Destination.find({ active: true });
        const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;

        let csv = 'Destination,City,Service Name,Service Type,Rate\n';
        dests.forEach(d => {
            (d.cityServices || []).forEach(s => {
                csv += `${esc(d.name)},${esc(s.city)},${esc(s.name)},${esc(s.type)},${(s.rate || 0).toFixed(2)}\n`;
            });
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('services_catalog.csv');
        return res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.importCatalog = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
        }

        const text = req.file.buffer.toString('utf8');
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
            return res.status(400).json({ success: false, message: 'CSV is empty or missing data rows' });
        }

        // Skip header row
        const rows = lines.slice(1);
        const parseRow = line => {
            const parts = [];
            let cur = '', inQ = false;
            for (const ch of line) {
                if (ch === '"') { inQ = !inQ; }
                else if (ch === ',' && !inQ) { parts.push(cur.trim()); cur = ''; }
                else cur += ch;
            }
            parts.push(cur.trim());
            return parts;
        };

        let added = 0, skipped = 0;
        for (const line of rows) {
            const [destName, city, name, type, rateStr] = parseRow(line);
            if (!destName || !city || !name) { skipped++; continue; }

            const rate = parseFloat(rateStr) || 0;
            const svcType = type || 'Other';

            const dest = await Destination.findOne({ name: { $regex: new RegExp(`^${destName}$`, 'i') } });
            if (!dest) { skipped++; continue; }

            // Avoid duplicates (same city + name)
            const exists = (dest.cityServices || []).some(
                s => s.city.toLowerCase() === city.toLowerCase() && s.name.toLowerCase() === name.toLowerCase()
            );
            if (exists) { skipped++; continue; }

            dest.cityServices = dest.cityServices || [];
            dest.cityServices.push({ city, name, type: svcType, rate });
            await dest.save();
            added++;
        }

        res.status(200).json({ success: true, message: `Imported ${added} services, skipped ${skipped}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Destinations
exports.getDestinations = async (req, res) => {
    try {
        const dests = await Destination.find();
        res.status(200).json({ success: true, data: dests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.deleteDestination = async (req, res) => {
    try {
        const destination = await Destination.findByIdAndDelete(req.params.id);
        if (!destination) {
            return res.status(404).json({ success: false, message: 'Destination not found' });
        }
        res.status(200).json({ success: true, message: 'Destination deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
