BASE URL:
http://localhost:3001

Endpoints:
GET /api/business-news : gets the data from the business-news sheet
GET /api/corp-news : gets the data from the corporate news sheet
 
GET /api/event-media : Lists the content of the drive folder of event media
GET /api/event-media/id : Gets the specific media from the event media folder

GET /api/employees : Gets the data from the employees sheet
GET /api/employees-images : Lists the images of the employees from the employees images drive folder
GET /api/employee-images/id : Gets the specific image from the folder

GET /api/event-details : Gets the details from the event sheet
GET /api/health-check : Checks the api status

Business News:
Endpoint:
GET /api/business-news

Response:
[
  ["Project A", "Customer X", "Completed"],
  ["Project B", "Customer Y", "In Progress"]
]

- Returns rows from Google Sheets containing business updates.
- Frontend can loop through this array and render in a carousel or table.


Corporate News:
Endpoint:
GET /api/corp-news

Response:
[
  ["Town Hall on 30th Aug", "New Policy Update", "New Joinees"]
]

- Similar to business news but for internal updates.


Event Media (Images & Videos)
Endpoint (metadata):
GET /api/event-media

Response:
[
  {
    "id": "1S-ArQo9UNgm4N4je7Lrf6END7wRZ1J_S",
    "name": "Dog_Barks_at_Kitten_Video.mp4",
    "type": "video",
    "url": "http://localhost:3001/api/event-media/1S-ArQo9UNgm4N4je7Lrf6END7wRZ1J_S",
    "durationSeconds": 60
  },
  {
    "id": "1aBcdEfG2",
    "name": "Team_Photo.jpg",
    "type": "image",
    "url": "http://localhost:3001/api/event-media/1aBcdEfG2",
    "durationSeconds": 10
  }
]

Employee details:
Endpoint:
GET /api/employees

Response:
[
  [
    "Employee name",
    "Employee detail",
    "Employee image url"
  ],
  [
    "Catesh",
    "I am catesh funda from meenangadi",
    "https://drive.google.com/file/d/1r3OVdmpMbS5rtryqvuuEiEzFCX0sTBHj/view?usp=sharing"
  ]
]
- Similar to business news but for employee details.


Employee Media (Images)
Endpoint (metadata):
GET /api/employee-images

Response:
[
  {
    "id": "1r3OVdmpMbS5rtryqvuuEiEzFCX0sTBHj",
    "name": "catesh.jpg",
    "url": "http://localhost:3001/api/employee-images/1r3OVdmpMbS5rtryqvuuEiEzFCX0sTBHj"
  }
]

Notes for Frontend:
- type: "video" or "image"
- url: Use this as src for <video> or <img> tags.
- durationSeconds: Use this to determine how long the item should display in the carousel.
- Backend handles authentication — frontend does not need Google credentials.
- Video streams from backend without downloading to frontend.



Health Check
Endpoint:
GET /api/health

Response:
{ "ok": true }


Notes:
- /api/event-media/:fileId streams the media directly.
- Images have default durationSeconds = 10s.
- Videos have durationSeconds = actual length + 2s buffer.