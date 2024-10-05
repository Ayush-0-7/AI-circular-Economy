import React, { useState, useEffect } from 'react';
import { db } from './Firebase'; // Firestore instance
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore'; // Firestore methods
import { fetchPotentialBuyers, generateDescription, fetchDemand } from './Gemini'; // Import the existing functions
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { auth } from './Firebase'; // Import Firebase Auth
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged

const getDemandColor = (demand) => {
  const clampedDemand = Math.max(0, Math.min(demand, 100));
  const red = Math.floor((100 - clampedDemand) * 2.55);
  const green = Math.floor(clampedDemand * 2.55);
  const blue = 0;
  return `rgb(${red}, ${green}, ${blue})`;
};

// Function to generate a random product ID
const generateProductId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Alphanumeric characters
  let productId = '';
  for (let i = 0; i < 5; i++) {
    productId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return productId;
};

function SellerDashboard() {
  const navigate = useNavigate(); // Initialize useNavigate
  const [products, setProducts] = useState([]); // Product listings
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    quantity: '',
    price: '',
    type: 'Waste Product', // Default type set to Waste Product
    description: '',
    demand: '',
    email: '', // Email field
  });
  const [isGenerating, setIsGenerating] = useState(false); // State to track if description is generating
  const [loadingDemand, setLoadingDemand] = useState(false); // Loading state for demand fetching
  const [userEmail, setUserEmail] = useState(''); // State to store the current user's email
  const [requests, setRequests] = useState([]); // State to store requests
  const [showRequests, setShowRequests] = useState(false); // State to toggle requests modal

  // Automatically fetch user email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email); // Set the email in the state
        setNewProduct((prevProduct) => ({
          ...prevProduct,
          email: user.email, // Set email from Firebase Auth
        }));
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Fetch products from Firestore when the component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsQuery = query(
          collection(db, 'products'),
          where('email', '==', userEmail) // Filter by current user's email
        );
        const querySnapshot = await getDocs(productsQuery);
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch demand for each product
        const productsWithDemand = await Promise.all(
          productsData.map(async (product) => {
            const demand = await fetchDemand(product.name);
            return { ...product, demand: parseFloat(demand) || 0 }; // Add demand to product data
          })
        );

        setProducts(productsWithDemand); // Set the fetched data with demand
      } catch (error) {
        console.error('Error fetching products: ', error);
      }
    };

    if (userEmail) {
      fetchProducts(); // Only fetch products if the user email is available
    }
  }, [userEmail]); // Dependency on userEmail

  // Fetch requests made by buyers
  const fetchRequests = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'Requests'), // Replace 'requests' with your collection name
        where('sellerEmail', '==', userEmail) // Filter by current user's email
      );
      const querySnapshot = await getDocs(requestsQuery);
      const requestsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(requestsData); // Set requests data in state
    } catch (error) {
      console.error('Error fetching requests: ', error);
    }
  };

  // Fetch requests when the requests modal is opened
  useEffect(() => {
    if (showRequests) {
      fetchRequests();
    }
  }, [showRequests]);

  // Handle input changes for new product
  const handleInputChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  // Automatically fetch demand when name and category fields change
  useEffect(() => {
    const fetchProductDemand = async () => {
      if (newProduct.name && newProduct.category) {
        setLoadingDemand(true);
        const demand = await fetchDemand(newProduct.name, newProduct.category);
        setNewProduct((prevProduct) => ({
          ...prevProduct,
          demand: parseFloat(demand) || 0, // Automatically fill the demand field
        }));
        setLoadingDemand(false);
      }
    };
    fetchProductDemand();
  }, [newProduct.name, newProduct.category]);

  // Handle form submission to add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const productId = generateProductId(); // Generate a unique product ID
      const docRef = await addDoc(collection(db, 'products'), {
        productId, // Store the product ID in Firestore
        name: newProduct.name,
        category: newProduct.category,
        quantity: parseInt(newProduct.quantity),
        price: parseFloat(newProduct.price),
        type: newProduct.type, // Store selected product type
        description: newProduct.description,
        demand: 50, // Default demand
        status: 'Available',
        email: newProduct.email, // Add email field to Firestore
      });

      const newListing = {
        id: docRef.id,
        productId, // Include the generated product ID
        name: newProduct.name,
        category: newProduct.category,
        quantity: parseInt(newProduct.quantity),
        price: parseFloat(newProduct.price),
        type: newProduct.type, // Include product type in local state
        description: newProduct.description,
        demand: newProduct.demand,
        status: 'Available',
        email: newProduct.email, // Include email in local state
      };

      setProducts([...products, newListing]);
      setNewProduct({
        name: '',
        category: '',
        quantity: '',
        price: '',
        type: 'Waste Product', // Reset type field to default value
        description: '',
        demand: '',
        email: '', // Reset email field
      });
    } catch (error) {
      console.error('Error adding product: ', error);
    }
  };

  // Generate product description using the separate Gemini function
  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    const description = await generateDescription(newProduct.name, newProduct.category, newProduct.quantity);
    setNewProduct((prevProduct) => ({
      ...prevProduct,
      description, // Update description
    }));
    setIsGenerating(false);
  };

  // Fetch and navigate to the potential buyers page
  const handleViewPotentialBuyers = async (product) => {
    try {
      navigate('/potentialbuyers', { state: { productName: product.name, productCategory: product.category } });
    } catch (error) {
      console.error('Error fetching potential buyers:', error);
    }
  };

  // Delete product from Firestore and local state
  const handleDeleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId)); // Delete from Firestore
      setProducts(products.filter((product) => product.id !== productId)); // Update local state
    } catch (error) {
      console.error('Error deleting product: ', error);
    }
  };

  return (
    <div className="seller-dashboard-container bg-gray-100 min-h-screen p-4 relative">
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>

      {/* Requests Button */}
      <button
        className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => navigate("/requests")}
      >
        Requests
      </button>

      {/* Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl font-bold mb-4">Requests</h2>
            {requests.length > 0 ? (
              <ul>
                {requests.map((request) => (
                  <li key={request.id}>
                    {request.productName} - {request.quantity} units requested
                    by {request.buyerEmail}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No requests found.</p>
            )}
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setShowRequests(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Form to add a new product */}
      <div className="product-form bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold mb-4">Add a New Product</h2>
        <form onSubmit={handleAddProduct}>
          {/* Product Name */}
          <div className="mb-4">
            <label className="block text-lg font-semibold mb-2">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-lg font-semibold mb-2">Category</label>
            <input
              type="text"
              name="category"
              value={newProduct.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter product category"
              required
            />
          </div>

          {/* Quantity */}
          <div className="mb-4 flex">
            <div className="w-2/3">
              <label className="block text-lg font-semibold mb-2">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={newProduct.quantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter quantity"
                required
              />
            </div>

            {/* Units Dropdown */}
            <div className="w-1/3 ml-4">
              <label className="block text-lg font-semibold mb-2">Unit</label>
              <select
                name="unit"
                value={newProduct.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="kg">kg</option>
                <option value="l">l</option>
                <option value="gm">gm</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="block text-lg font-semibold mb-2">Price</label>
            <input
              type="number"
              step="0.01"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter price"
              required
            />
          </div>

          {/* Product Type */}
          <div className="mb-4">
            <label className="block text-lg font-semibold mb-2">
              Product Type
            </label>
            <select
              name="type"
              value={newProduct.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="Waste Product">Waste Product</option>
              <option value="By-product">By-product</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-lg font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter product description"
            />
          </div>

          {/* Generate Description Button */}
          <div className="mb-4">
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleGenerateDescription}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Description"}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Product
          </button>
        </form>
      </div>

      {/* Product Listings */}
      <div className="product-listings bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Your Products</h2>
        {products.length > 0 ? (
          <ul>
            {products.map((product) => (
              <li key={product.id} className="mb-4">
                <h3 className="text-lg font-bold">{product.name}</h3>
                <p>Category: {product.category}</p>
                <p>Quantity: {product.quantity}</p>
                <p>Price: {product.price}</p>
                <p>Type: {product.type}</p>
                <p>Description: {product.description}</p>
                <p style={{ color: getDemandColor(product.demand) }}>
                  Demand: {product.demand}%
                </p>
                <p>Status: {product.status}</p>

                {/* Delete Button */}
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded mt-2"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Delete
                </button>

                {/* View Potential Buyers Button */}
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded mt-2 ml-2"
                  onClick={() => handleViewPotentialBuyers(product)}
                >
                  View Potential Buyers
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;
