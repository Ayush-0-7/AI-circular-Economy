import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './Firebase'; // Import Firestore config
import { useNavigate } from 'react-router-dom';
import { auth } from './Firebase'; // Import Firebase Auth
import { onAuthStateChanged } from 'firebase/auth'; // Import Auth state change function

const BuyerDashboard = () => {
  const [products, setProducts] = useState([]); // All products
  const [searchTerm, setSearchTerm] = useState(''); // Search term
  const [filteredProducts, setFilteredProducts] = useState([]); // Filtered products based on search term
  const [showRequests, setShowRequests] = useState(false); // Flag for showing requests
  const [userRequests, setUserRequests] = useState([]); // User requests

  // State for the modal
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // User's email
  const [expectedPrice, setExpectedPrice] = useState('');

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsArray);
        setFilteredProducts(productsArray); // Initially, show all products
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  // Fetch user requests from Firestore
  const fetchUserRequests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "requestHistory"));
      const requestsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserRequests(requestsArray);
    } catch (error) {
      console.error("Error fetching user requests:", error);
    }
  };

  // Fetch the current user's email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmail(user.email); // Set email state to current user's email
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Update the filtered products as the user types in the search bar
  useEffect(() => {
    const results = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm, products]);

  // Handle request action
  const handleRequest = (product) => {
    setSelectedProduct(product); // Set the selected product
    setShowModal(true); // Show the modal
  };

  // Handle request submission
  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    // Create the request object with a status field
    const requestData = {
      phone,
      buyerEmail: email, // Email of the buyer
      sellerEmail: selectedProduct.email, // Email of the seller
      expectedPrice,
      productName: selectedProduct.name, // Optionally, include product name for reference
      productId: selectedProduct.id,
      offeredPrice: selectedProduct.price,
      status: "Pending" // Default status set to 'Pending'
    };

    try {
      // Step 1: Add to requestHistory collection
      const requestHistoryRef = await addDoc(collection(db, "requestHistory"), requestData);
      
      // Step 2: Get the requestHistory ID
      const requestHistoryId = requestHistoryRef.id;

      // Step 3: Create a new request with the requestHistoryId
      const fullRequestData = { ...requestData, requestHistoryId };

      // Add request data to the Firestore 'Requests' collection
      await addDoc(collection(db, "Requests"), fullRequestData);

      alert(`Request sent for product: ${selectedProduct.name}\nPhone: ${phone}\nEmail: ${email}\nExpected Price: ₹${expectedPrice}\nStatus: Pending`);
      
      // Reset form fields
      setPhone('');
      setExpectedPrice('');
      setShowModal(false); // Close the modal
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Error submitting request. Please try again.");
    }
  };
  
  const navigate = useNavigate();
  
  // Handle showing user requests
  const handleShowRequests = () => {
    navigate('/myrequests');
  };

  return (
    <div className="p-6">
      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Update search term as user types
        />
      </div>

      {/* Product Listings or 'Item not found' */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="border rounded-lg overflow-hidden shadow-lg">
              {/* Product Image */}
              <img
                src={`https://source.unsplash.com/300x300/?${encodeURIComponent(product.name)}`}
                alt={product.name}
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.src = 'https://source.unsplash.com/300x300/?product'; }}
              />

              {/* Product Details */}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <p className="text-gray-600 mb-1"><strong>Category:</strong> {product.category}</p>
                <p className="text-gray-600 mb-1"><strong>Description:</strong> {product.description}</p>
                <p className="text-gray-600 mb-1"><strong>Quantity:</strong> {product.quantity}</p>
                <p className="text-gray-600 mb-1"><strong>Price:</strong> ₹{product.price}</p>
                <p className="text-gray-600"><strong>Status:</strong> {product.status}</p>

                {/* Request Button */}
                <button
                  onClick={() => handleRequest(product)}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Request
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600">
          <h2 className="text-2xl">Item not found</h2>
        </div>
      )}

      {/* My Requests Button */}
      <button
        onClick={handleShowRequests}
        className="mt-6 bg-green-500 text-white px-4 py-2 rounded-lg"
      >
        My Requests
      </button>

      {/* Modal for Request Form */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/3">
            <h2 className="text-xl font-semibold mb-4">Request for {selectedProduct?.name}</h2>
            <form onSubmit={handleSubmitRequest}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Phone Number:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Email:</label>
                <input
                  type="email"
                  value={email}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  readOnly // Make the email field read-only
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Expected Price:</label>
                <input
                  type="text"
                  value={expectedPrice}
                  onChange={(e) => setExpectedPrice(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowModal(false)} // Close modal
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
