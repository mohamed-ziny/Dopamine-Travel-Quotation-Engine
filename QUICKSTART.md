# 🚀 QUICK START GUIDE

## Get Started in 5 Minutes!

### Step 1: Install Dependencies
```bash
cd travel-quotation-api
npm install
```

### Step 2: Start MongoDB

**Option A - Local MongoDB:**
```bash
# Make sure MongoDB is running
mongod
```

**Option B - MongoDB Atlas (Cloud):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env` file with your connection string

### Step 3: Seed Database (Optional but Recommended)
```bash
npm run seed
```
This creates sample destinations, users, and quotations.

### Step 4: Start Server
```bash
npm run dev
```

Server will run on: **http://localhost:5000**

### Step 5: Test API

Open browser or Postman and try:
```
http://localhost:5000/health
```

You should see:
```json
{
  "success": true,
  "message": "API is running"
}
```

---

## 🎯 Your First API Call

### Get All Quotations
```bash
curl http://localhost:5000/api/quotations
```

Or open in browser:
```
http://localhost:5000/api/quotations
```

### Get All Destinations
```
http://localhost:5000/api/destinations
```

---

## 📝 Create Your First Quotation

Use Postman or any API client:

```http
POST http://localhost:5000/api/quotations
Content-Type: application/json

{
  "destination": "Dubai",
  "dates": {
    "start": "2026-04-01",
    "end": "2026-04-05",
    "nights": 4
  },
  "pax": {
    "adults": 2,
    "children": 0
  },
  "staff": {
    "sales": "Omar Elkholy",
    "ops": "Ahmed Hassan"
  },
  "hotels": [
    {
      "city": "Dubai",
      "hotel": "Atlantis The Palm",
      "checkIn": "2026-04-01",
      "nights": 4,
      "roomType": "Deluxe",
      "cost": 1600
    }
  ],
  "services": [
    {
      "type": "Visa",
      "details": "UAE visa",
      "pax": 2,
      "rate": 50,
      "total": 100
    }
  ],
  "itinerary": "Beach vacation"
}
```

---

## 🔧 Troubleshooting

**"Cannot connect to MongoDB"**
- Check MongoDB is running: `mongod`
- Or use MongoDB Atlas connection string in `.env`

**"Port 5000 already in use"**
- Change PORT in `.env` to 5001 or another port
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

**"Module not found"**
```bash
rm -rf node_modules
npm install
```

---

## 📚 Next Steps

1. Read the full `README.md` for detailed documentation
2. Check `API_EXAMPLES.md` for all endpoint examples
3. Connect your frontend to these endpoints
4. Customize models and add more features!

---

## 🎉 That's It!

You now have a fully functional travel quotation API running!

**Sample Login Credentials:**
- Email: `omar@dopaminetravel.com`
- Password: `password123`

For more help, check the README.md file.
