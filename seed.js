const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Destination = require('./models/Destination');
const User = require('./models/User');
const Quotation = require('./models/Quotation');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected for seeding'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Sample data
const destinations = [
  {
    name: 'Umrah',
    description: 'Umrah',
    cities: ['Mecca', 'Medina'],
    hotels: [
      {
        city: 'Mecca',
        name: 'Swissotel Makkah',
        rating: 5,
        roomTypes: ['Standard', 'Deluxe', 'Suite'],
        basePrice: 200
      },
      {
        city: 'Mecca',
        name: 'Pullman ZamZam Makkah',
        rating: 5,
        roomTypes: ['Standard', 'Deluxe'],
        basePrice: 250
      },
      {
        city: 'Medina',
        name: 'Anwar Al Madinah Movenpick',
        rating: 5,
        roomTypes: ['Standard', 'Deluxe', 'Suite'],
        basePrice: 180
      }
    ],
    active: true
  },
  {
    name: 'Dubai',
    description: 'Dubai luxury tours',
    cities: ['Dubai'],
    hotels: [
      {
        city: 'Dubai',
        name: 'Atlantis The Palm',
        rating: 5,
        roomTypes: ['Deluxe', 'Suite', 'Presidential'],
        basePrice: 400
      },
      {
        city: 'Dubai',
        name: 'Burj Al Arab',
        rating: 5,
        roomTypes: ['Suite', 'Royal Suite'],
        basePrice: 800
      }
    ],
    active: true
  },
  {
    name: 'Kazakhstan',
    description: 'Kazakhstan adventure tours',
    cities: ['Almaty', 'Astana'],
    hotels: [
      {
        city: 'Almaty',
        name: 'Rixos Almaty',
        rating: 5,
        roomTypes: ['Standard', 'Deluxe'],
        basePrice: 150
      },
      {
        city: 'Astana',
        name: 'The Ritz-Carlton',
        rating: 5,
        roomTypes: ['Deluxe', 'Suite'],
        basePrice: 200
      }
    ],
    active: true
  },
  {
    name: 'Turkey',
    description: 'Turkey cultural tours',
    cities: ['Istanbul', 'Cappadocia'],
    hotels: [
      {
        city: 'Istanbul',
        name: 'Four Seasons Sultanahmet',
        rating: 5,
        roomTypes: ['Deluxe', 'Suite'],
        basePrice: 300
      },
      {
        city: 'Cappadocia',
        name: 'Museum Hotel',
        rating: 5,
        roomTypes: ['Cave Room', 'Suite'],
        basePrice: 250
      }
    ],
    active: true
  }
];

const users = [
  {
    name: 'Omar Elkholy',
    email: 'omar@dopaminetravel.com',
    password: 'password123',
    role: 'sales',
    active: true
  },
  {
    name: 'Alaa Mohamed',
    email: 'alaa@dopaminetravel.com',
    password: 'password123',
    role: 'operations',
    active: true
  },
  {
    name: 'Ahmed Hassan',
    email: 'ahmed@dopaminetravel.com',
    password: 'password123',
    role: 'operations',
    active: true
  },
  {
    name: 'Sara Ali',
    email: 'sara@dopaminetravel.com',
    password: 'password123',
    role: 'sales',
    active: true
  },
  {
    name: 'Admin User',
    email: 'admin@dopaminetravel.com',
    password: 'admin123',
    role: 'admin',
    active: true
  }
];

const sampleQuotations = [
  {
    refId: 'QE-KA-09FEB-1',
    destination: 'Kazakhstan',
    dates: {
      start: new Date('2026-02-18'),
      end: new Date('2026-02-25'),
      nights: 7
    },
    pax: {
      adults: 1,
      children: 0
    },
    staff: {
      sales: 'Omar Elkholy',
      ops: 'Alaa Mohamed'
    },
    hotels: [
      {
        city: 'Almaty',
        hotel: 'Rixos Almaty',
        checkIn: new Date('2026-02-18'),
        nights: 3,
        roomType: 'Deluxe',
        cost: 450
      },
      {
        city: 'Astana',
        hotel: 'The Ritz-Carlton',
        checkIn: new Date('2026-02-21'),
        nights: 4,
        roomType: 'Suite',
        cost: 800
      }
    ],
    services: [
      {
        type: 'Visa',
        details: 'Kazakhstan tourist visa',
        pax: 1,
        rate: 50,
        total: 50
      },
      {
        type: 'AirportTransfer',
        details: 'Airport transfers and city tours',
        source: 'Almaty Airport',
        destination: 'Hotel',
        carType: 'Sedan',
        pax: 1,
        rate: 200,
        total: 200
      }
    ],
    itinerary: 'Day 1: Arrival in Almaty\nDay 2-3: Almaty city tour\nDay 4: Transfer to Astana\nDay 5-7: Astana exploration',
    total: 1500,
    status: 'confirmed'
  }
];

// Import data
const importData = async () => {
  try {
    // Clear existing data
    await Destination.deleteMany();
    await User.deleteMany();
    await Quotation.deleteMany();

    console.log('🗑️  Data cleared');

    // Insert new data
    await Destination.insertMany(destinations);
    console.log('✅ Destinations imported');

    await User.insertMany(users);
    console.log('✅ Users imported');

    // await Quotation.insertMany(sampleQuotations);
    // console.log('✅ Sample quotations imported');

    console.log('\n🎉 Seeding complete!');
    console.log('\n📝 Sample credentials:');
    console.log('   Sales: omar@dopaminetravel.com / password123');
    console.log('   Operations: alaa@dopaminetravel.com / password123');
    console.log('   Admin: admin@dopaminetravel.com / admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await Destination.deleteMany();
    await User.deleteMany();
    await Quotation.deleteMany();

    console.log('🗑️  All data deleted');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run based on command
if (process.argv[2] === '-d') {
  deleteData();
} else {
  importData();
}
