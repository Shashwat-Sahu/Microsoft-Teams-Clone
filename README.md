# Microsoft Teams Clone
Hey Code geek, welcome to my project 'Microsoft Teams Clone'. It was under the challenge of Engage Mentorship program 2021 by Microsoft. Its been a great journey and quite insightful too.
<br/>
Challenge was basically about connecting two people on teams via video calling. On above of that I incorporated following features:
* Group Video Calling
* Meeting Chat (inside meeting)
* Teams Chat (outside meeting)
* Screen Share
* Screen Recording
* Transcript
* Authorization

**Website Link**: [teams-clone-shashwat](https://teams-clone-shashwat.web.app/)

# Agile Implementation
The Development was a series of Continous Integration and continous Deployment. Each functionality was divided in weeks under SCRUM.  Each sprint’s goal was to build the most important features first and come out with a potentially deliverable product. Also even adapt feature which is taken as customer needs, was added in subsequent sprint.
<br/>
Priorty Level:
* 1: Lowest Priority
* 2: Low Priority
* 3: Medium Priority
* 4: High Priority
* 5: Highest Priority


|Type|Week|Description|Priority level|Status
|----|----|-----|-----|-----|
Setup|Week 1|Front End : React<br/>Backend: Nodejs<br/>DBMS: MongoDB| 4|Completed
Feature|Week 1|Video Calling between two people| 5|Completed
|Bug 01| Week 1| Peer Connections distrupted| 5|Resolved
Feature|Week 1|Video Calling between group of people| 4|Pending
|Bug 02| Week 1| Peers not destroying in group video calling| 5|Pending
Feature|Week 2|Meeting Chat| 3|Completed
|Bug 02| Week 2| Peers not destroying in group video calling| 5|Resolved
Feature|Week 2|Video Calling between group of people| 4|Completed
Feature|Week 2|Screen Sharing| 3|Completed
Feature|Week 2|Meeting Chat| 3|Completed
Bug 03|Week 2|Scren Sharing not enabled for other people|5| Resolved
Feature| Week 3| Screen Recording|3 |Completed
Feature| Week 3| Transcript Added (Socket implementation remaining)| 2|Pending
Feature|Week 4| Chat outside meeting (Adapt feature)|5|Completed
Feature|Week 4|Authorization|3|Completed
Procedure|Week 4|Code cleaning|2|Completed

# Pre Requisites
* Gain Mongo access link from from Mongo DB and paste in .env as MONGO_URI
* Gain App id and access token from symbl.ai and paste in .env as 'appid' and 'accessToken'

# Client Side
## Code Prospects
### `npm install`
Install modules mentioned in package.json
### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.


# Server Side
### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:8000](http://localhost:8000) to run server.

You will also see any errors or information in the console.

# Screenshots

## Sign In
![signin](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/signin.png)

## Sign Up
![signup](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/signup.png)

## Teams Chats
![teams chats](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/Screenshot%202021-07-11%20195107.png)

## Create Room
![create room](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/create%20room.png)

## Join Room
![join room](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/join%20room.png)

## Home
![home before joining](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/web%20home.png)

## Meeting
![meeting](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/web%20meet.png)

## Meeting chats
![meeting Chats](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/web%20chat.png)

## Screen Share
![screen share](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/web%20screen%20share.png)

## Screen Recorder
![meeting Chats](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/web%20screen%20recorder.png)

### Screen Recorder Example
![meeting Chats](https://github.com/Shashwat-Sahu/microsoft-teams-assets/blob/main/recording.gif?raw=true)

## Transcript
![transcript](https://raw.githubusercontent.com/Shashwat-Sahu/microsoft-teams-assets/main/web%20transcript.png)

