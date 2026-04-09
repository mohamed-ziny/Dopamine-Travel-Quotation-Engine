# API Testing Examples

## Base URL
```
http://localhost:5000
```

---

## 1. HEALTH CHECK

### Get Health Status
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-02-23T10:30:00.000Z"
}
```

---

## 2. DESTINATIONS

### Get All Destinations
```http
GET /api/destinations
```

### Get Destination by Name
```http
GET /api/destinations/Dubai
```

### Get Hotels in City
```http
GET /api/destinations/Dubai/hotels/Dubai
```

### Create Destination (Admin)
```http
POST /api/destinations
Content-Type: application/json

{
  "name": "Bali",
  "description": "Tropical paradise",
  "cities": ["Denpasar", "Ubud"],
  "hotels": [
    {
      "city": "Ubud",
      "name": "Four Seasons Resort",
      "rating": 5,
      "roomTypes": ["Deluxe", "Villa"],
      "basePrice": 350
    }
  ]
}
```

---

## 3. STAFF & AUTHENTICATION

### Get All Staff
```http
GET /api/staff
```

### Get Staff by Role
```http
GET /api/staff/sales
```

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@dopaminetravel.com",
  "password": "password123",
  "role": "sales"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "omar@dopaminetravel.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Omar Elkholy",
    "email": "omar@dopaminetravel.com",
    "role": "sales"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 4. QUOTATIONS

### Get All Quotations
```http
GET /api/quotations
```

### Get with Filters
```http
GET /api/quotations?destination=Dubai&status=confirmed&page=1&limit=10
```

### Get Quotation by ID
```http
GET /api/quotations/65f1a2b3c4d5e6f7g8h9i0j1
```

### Get Quotation by Reference ID
```http
GET /api/quotations/ref/QE-DU-23FEB-1
```

### Create Quotation
```http
POST /api/quotations
Content-Type: application/json

{
  "destination": "Dubai",
  "dates": {
    "start": "2026-03-15",
    "end": "2026-03-20",
    "nights": 5
  },
  "pax": {
    "adults": 2,
    "children": 1
  },
  "staff": {
    "sales": "Omar Elkholy",
    "ops": "Ahmed Hassan"
  },
  "hotels": [
    {
      "city": "Dubai",
      "hotel": "Atlantis The Palm",
      "checkIn": "2026-03-15",
      "nights": 5,
      "roomType": "Deluxe Ocean View",
      "cost": 2000
    }
  ],
  "services": [
    {
      "type": "Visa",
      "details": "UAE tourist visa - 30 days",
      "pax": 3,
      "rate": 50,
      "total": 150
    },
    {
      "type": "Transport",
      "details": "Airport pickup and drop-off",
      "pax": 3,
      "rate": 100,
      "total": 300
    }
  ],
  "itinerary": "Day 1: Arrival at Dubai International Airport\nDay 2: Desert Safari\nDay 3: Burj Khalifa & Dubai Mall\nDay 4: Beach day at Jumeirah\nDay 5: Departure"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quotation created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "refId": "QE-DU-23FEB-1",
    "destination": "Dubai",
    "dates": {
      "start": "2026-03-15T00:00:00.000Z",
      "end": "2026-03-20T00:00:00.000Z",
      "nights": 5
    },
    "pax": {
      "adults": 2,
      "children": 1
    },
    "staff": {
      "sales": "Omar Elkholy",
      "ops": "Ahmed Hassan"
    },
    "hotels": [...],
    "services": [...],
    "itinerary": "Day 1: Arrival...",
    "total": 2450,
    "status": "draft",
    "createdAt": "2026-02-23T10:30:00.000Z",
    "updatedAt": "2026-02-23T10:30:00.000Z"
  }
}
```

### Update Quotation
```http
PUT /api/quotations/65f1a2b3c4d5e6f7g8h9i0j1
Content-Type: application/json

{
  "pax": {
    "adults": 3,
    "children": 2
  },
  "status": "confirmed"
}
```

### Update Quotation Status Only
```http
PATCH /api/quotations/65f1a2b3c4d5e6f7g8h9i0j1/status
Content-Type: application/json

{
  "status": "confirmed"
}
```

### Delete Quotation
```http
DELETE /api/quotations/65f1a2b3c4d5e6f7g8h9i0j1
```

### Get Statistics
```http
GET /api/quotations/stats/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalQuotations": 45,
    "totalRevenue": 125000,
    "byStatus": [
      {
        "_id": "confirmed",
        "count": 30,
        "totalRevenue": 95000,
        "avgRevenue": 3166.67
      },
      {
        "_id": "draft",
        "count": 10,
        "totalRevenue": 25000,
        "avgRevenue": 2500
      },
      {
        "_id": "cancelled",
        "count": 5,
        "totalRevenue": 5000,
        "avgRevenue": 1000
      }
    ]
  }
}
```

---

## 5. ADVANCED QUERIES

### Filter by Multiple Parameters
```http
GET /api/quotations?destination=Dubai&status=confirmed&sales=Omar%20Elkholy&startDate=2026-03-01&endDate=2026-03-31&page=1&limit=20&sort=-total
```

### Filter by Date Range
```http
GET /api/quotations?startDate=2026-02-01&endDate=2026-02-28
```

### Sort by Total (Descending)
```http
GET /api/quotations?sort=-total
```

### Sort by Created Date (Ascending)
```http
GET /api/quotations?sort=createdAt
```

---

## 6. ERROR RESPONSES

### 404 - Not Found
```json
{
  "success": false,
  "message": "Quotation not found"
}
```

### 400 - Validation Error
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    "Destination is required",
    "Start date is required"
  ]
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Server Error",
  "error": "Connection timeout"
}
```

---

## 7. AUTHENTICATION (Future Protected Routes)

For protected routes, add JWT token to headers:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Testing Tips

1. **Use Postman Collections**: Save these as a collection for easy testing
2. **Environment Variables**: Set `baseUrl` as a variable
3. **Save Responses**: Save IDs from POST responses for subsequent requests
4. **Test Validation**: Try sending incomplete data to test validation
5. **Test Pagination**: Try different page and limit values
6. **Test Filters**: Combine multiple filters to test query logic

---

## Sample Test Workflow

1. **Seed Database**: `npm run seed`
2. **Login**: Get JWT token
3. **Get Destinations**: See available options
4. **Create Quotation**: Use a valid destination
5. **Get All Quotations**: Verify creation
6. **Update Status**: Change to "confirmed"
7. **Get Statistics**: See updated stats
8. **Delete**: Clean up test data
