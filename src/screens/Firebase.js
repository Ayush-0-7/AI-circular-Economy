// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB9CfO5Gosk3Kesv1Skz7xXODUr2bJg_fQ",
  authDomain: "kachra-d5222.firebaseapp.com",
  projectId: "kachra-d5222",
  storageBucket: "kachra-d5222.appspot.com",
  messagingSenderId: "940334772082",
  appId: "1:940334772082:web:04213ca295c1143072f7eb",
  measurementId: "G-ZDLTVWP8VF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth , db };