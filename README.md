# PARALLEL

An app for quickly discovering connections using your photo library.

Built for BYU CS260 Fall 2025.

https://dougalcaleb.github.io/portfolio/parallel/

### Elevator pitch

So often you miss out on connections with people because you just don't know what you have in common. 

But everyone loves taking photos at their favorite or most important places. 

Parallel quickly finds those connections by cross-referencing your photo library with others -- instantly finding connections you might have never discovered otherwise!

### Initial Design

![Design image](design-mockup.png)

App Flow
- Pages include login/register, personal library, person search, and connect
- Bottom Navigation
- Mobile-first

Data Flow
- Sign up / login / authentication handled by AWS Cognito, supplemented by DynamoDB
- Additional user data and image data stored in DynamoDB
- Photo storage in AWS S3
- Backend server hosted on EC2, using NodeJS and ExpressJS
- Image metadata extraction and processing handled by server
- Image location processing handled by Google Geolocation API
- Websocket connection to server to facilitate Nearby Searching