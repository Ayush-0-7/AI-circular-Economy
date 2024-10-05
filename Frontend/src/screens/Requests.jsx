import React, { useState, useEffect } from 'react';
import { db } from './Firebase'; // Firestore instance
import { collection, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { auth } from './Firebase'; // Firebase Auth
import { onAuthStateChanged } from 'firebase/auth';

function Requests() {
  const [requests, setRequests] = useState([]); // Store requests data
  const [userEmail, setUserEmail] = useState(''); // Store the current user's email

  // Automatically fetch user email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email); // Set the email in the state
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Fetch requests from Firestore where sellerEmail equals the current user's email
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (userEmail) {
          const requestsQuery = query(
            collection(db, 'Requests'),
            where('sellerEmail', '==', userEmail) // Filter by current user's email
          );
          const querySnapshot = await getDocs(requestsQuery);
          const requestsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRequests(requestsData);
        }
      } catch (error) {
        console.error('Error fetching requests: ', error);
      }
    };

    fetchRequests();
  }, [userEmail]);

  // Handle accepting a request
  const handleAccept = async (productId, requestId, requestHistoryId) => {
    try {
      // Update the request's status to "Accepted" in the Requests collection
      const requestDoc = doc(db, 'Requests', requestId);
      await updateDoc(requestDoc, { status: "Accepted" });

      // Update the status in the requestHistory collection
      const requestHistoryDoc = doc(db, 'requestHistory', requestHistoryId);
      await updateDoc(requestHistoryDoc, { status: "Accepted" });

      // Delete the product from Firestore in the products collection
      const productDoc = doc(db, 'products', productId);
      await deleteDoc(productDoc);

      // Optionally, remove the request from the state after accepting
      setRequests(requests.filter((request) => request.id !== requestId));

      // Delete the request from the 'Requests' collection
      await deleteDoc(requestDoc);

      alert('Request accepted and product removed.');
    } catch (error) {
      console.error('Error accepting request: ', error);
    }
  };

 
  // Handle denying a request
  const handleDeny = async (requestId, requestHistoryId) => {
    try {
      // Update the request's status to "Rejected" in the Requests collection
      const requestDoc = doc(db, 'Requests', requestId);
      await updateDoc(requestDoc, { status: "Rejected" });

      // Update the status in the requestHistory collection
      const requestHistoryDoc = doc(db, 'requestHistory', requestHistoryId);
      await updateDoc(requestHistoryDoc, { status: "Rejected" });

      // Optionally, remove the request from the state after rejecting
      setRequests(requests.filter((request) => request.id !== requestId));

      // Delete the request from the 'Requests' collection
      await deleteDoc(requestDoc);

      alert('Request rejected.');
    } catch (error) {
      console.error('Error denying request: ', error);
    }
  };

  return (
    <div className="requests-container bg-gray-100 min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Requests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((request) => (
          <div key={request.id} className="border p-4 rounded bg-white shadow">
            <h3 className="text-xl font-semibold">{request.productName}</h3>
            <p>Product ID: {request.productId}</p>
            <p>Your Price: ₹{request.offeredPrice}</p>
            <p>Offered Price: ₹{request.expectedPrice}</p>
            <p>Buyer's Phone: {request.phone}</p>
            <p>Buyer's Email: {request.buyerEmail}</p>
            <p>Status: {request.status || 'Pending'}</p> {/* Display status */}
            <div className="flex space-x-4 mt-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={() => handleAccept(request.productId, request.id, request.requestHistoryId)}
              >
                Accept
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => handleDeny(request.id, request.requestHistoryId)}
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Requests;
