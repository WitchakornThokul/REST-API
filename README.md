#   Tax Calculator API
    REST API คำนวณภาษีเงินได้ส่วนบุคคล

#   เทคโนโลยีที่ใช้ 
    JavaScript
    Node.js + Express

#   วิธีติดตั้ง dependencies เข้าโฟลเดอร์โปรเจค 
    ถ้ายังไม่มี package.json ให้สร้าง
    npm init -y
    npm install express

#   วิธีรันเซิร์ฟเวอร์
    node .\server.js
    API จะรันที่ 'http://localhost:3000'

#   API Endpoints

### POST /tax/calculations
    คำนวณภาษีเงินได้
#   ตัวอย่างการใช้งาน
**Request Body:**
```json
{
  "totalIncome": 750000,
  "wht": 0,
  "allowances": []
}
```

**Response:**
```json
{
  "tax": 63500
}
```
#   คำนวณภาษีพื้นฐาน
```bash
curl -X POST http://localhost:5000/tax/calculations \
  -H "Content-Type: application/json" \
  -d '{
    "totalIncome": 750000,
    "wht": 0,
    "allowances": []
  }'
```

#   คำนวณภาษีพร้อม WHT
```bash
curl -X POST http://localhost:5000/tax/calculations \
  -H "Content-Type: application/json" \
  -d '{
    "totalIncome": 600000,
    "wht": 15000,
    "allowances": []
  }'
```
#   การทดสอบ
**Test Case 1: ไม่ต้องเสียภาษี**
```bash
Request:
{
  "totalIncome": 60000,
  "wht": 0,
  "allowances": []
}
Expected Response:
{
    "tax": 0
}
```

**Test Case 2: คำนวณภาษีขั้นเดียว**
```bash
Request:
{
  "totalIncome": 350000,
  "wht": 0,
  "allowances": []
}
Expected Response:
{
    "tax": 14000
}
```

**Test Case 3: คำนวณภาษีหลายขั้น**
```bash
Request:
{
  "totalIncome": 1200000,
  "wht": 0,
  "allowances": []
}
Expected Response:
{
    "tax": 138000
}
```

**Test Case 4: มี WHT**
```bash
Request:
{
  "totalIncome": 450000,
  "wht": 8000,
  "allowances": []
}
Expected Response:
{
    "tax": 16000
}
```

**Test Case 5: มีค่าลดหย่อน**
```bash
Request:
{
  "totalIncome": 700000,
  "wht": 0,
  "allowances": [
    {
      "allowanceType": "donation",
      "amount": 120000
    }
  ]
}
Expected Response:
{
    "tax": 41000
}
```

**Test Case 6: Validation - totalIncome ติดลบ**
```bash
Request:
{
  "totalIncome": -250000,
  "wht": 0,
  "allowances": []
}
Expected Response:
{
    "error": "totalIncome must be a positive number"
}
```

**Test Case 7: Validation - wht มากกว่า totalIncome**
```bash
Request:
{
  "totalIncome": 300000,
  "wht": 400000,
  "allowances": []
}
Expected Response:
{
    "error": "wht cannot be greater than totalIncome"
}
```
