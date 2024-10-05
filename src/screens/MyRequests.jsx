import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './Firebase'; // Import Firestore config
import { getAuth } from 'firebase/auth';

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const auth = getAuth(); // Get current user from Firebase Authentication
  const currentUser = auth.currentUser; // Current user

  useEffect(() => {
    const fetchRequests = async () => {
      if (!currentUser) return; // If user is not logged in, exit

      try {
        const q = query(
          collection(db, 'requestHistory'),
          where('buyerEmail', '==', currentUser.email) // Filter requests by current user's email
        );
        const querySnapshot = await getDocs(q);
        const requestsArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRequests(requestsArray); // Set requests state
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, [currentUser]);

  // Function to determine the status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-300';
      case 'Rejected':
        return 'bg-red-500';
      case 'Accepted':
        return 'bg-green-500';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Requests</h2>

      {requests.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {requests.map(request => (
            <div key={request.id} className={`border rounded-lg overflow-hidden shadow-lg ${getStatusColor(request.status)}`}>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{request.productName}</h3>
                <p className="text-gray-600 mb-1"><strong>Request ID:</strong> {request.id}</p> {/* Added Request ID */}
                <p className="text-gray-600 mb-1"><strong>Product ID:</strong> {request.productId}</p>
                <p className="text-gray-600 mb-1"><strong>Your Price:</strong> ₹{request.expectedPrice}</p>
                <p className="text-gray-600 mb-1"><strong>Seller's Price:</strong> ₹{request.offeredPrice}</p>
                <p className="text-gray-600 mb-1"><strong>Seller's Email:</strong> {request.sellerEmail}</p> {/* Added Seller's Email */}
                <p className="text-gray-600"><strong>Status:</strong> {request.status}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600">
          <h3 className="text-xl">No requests found</h3>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
