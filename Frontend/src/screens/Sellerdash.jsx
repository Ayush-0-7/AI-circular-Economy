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
    type: 'Waste Product',
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
        type: newProduct.type,
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
        type: newProduct.type,
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
        type: 'Waste Product',
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
        onClick={() => navigate('/requests')}
      >
        Requests
      </button>

      {/* Requests Modal */}
      {showRequests && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl mb-4">Requests</h2>
            {requests.length > 0 ? (
              requests.map((request) => (
                <div key={request.id} className="border p-2 mb-2 rounded">
                  <p>{request.message}</p>
                </div>
              ))
            ) : (
              <p>No requests available.</p>
            )}
            <button className="bg-red-500 text-white px-4 py-2 rounded mt-4" onClick={() => setShowRequests(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add New Product Form */}
      <form onSubmit={handleAddProduct} className="bg-white p-4 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
        <input
          type="text"
          name="name"
          value={newProduct.name}
          onChange={handleInputChange}
          placeholder="Product Name"
          required
          className="border p-2 rounded mb-4 w-full"
        />
        <input
          type="text"
          name="category"
          value={newProduct.category}
          onChange={handleInputChange}
          placeholder="Category"
          required
          className="border p-2 rounded mb-4 w-full"
        />
        <input
          type="number"
          name="quantity"
          value={newProduct.quantity}
          onChange={handleInputChange}
          placeholder="Quantity"
          required
          className="border p-2 rounded mb-4 w-full"
        />
        <input
          type="number"
          name="price"
          value={newProduct.price}
          onChange={handleInputChange}
          placeholder="Price"
          required
          className="border p-2 rounded mb-4 w-full"
        />
        <textarea
          name="description"
          value={newProduct.description}
          onChange={handleInputChange}
          placeholder="Description"
          className="border p-2 rounded mb-4 w-full"
        />
        <div className="flex items-center mb-4">
          <button
            type="button"
            onClick={handleGenerateDescription}
            disabled={isGenerating}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
          >
            {isGenerating ? 'Generating...' : 'Generate Description'}
          </button>
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Add Product
        </button>
      </form>

      {/* Product Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {products.map((product) => (
    <div key={product.id} className="border p-4 rounded bg-white shadow">
      <h3 className="text-xl font-semibold">{product.name}</h3>
      <p>Category: {product.category}</p>
      <p>Quantity: {product.quantity}</p>
      <p>Price: ${product.price.toFixed(2)}</p>
      <p>Status: {product.status}</p>
      <p style={{ color: getDemandColor(product.demand) }}>Demand: {product.demand}</p>
      <p>Product ID: {product.productId || product.id}</p> {/* Display Product ID */}
      <p>Description: {product.description}</p>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
        onClick={() => handleViewPotentialBuyers(product)}
      >
        View Potential Buyers
      </button>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded mt-2"
        onClick={() => handleDeleteProduct(product.id)}
      >
        Delete Product
      </button>
    </div>
  ))}
</div>
    </div>
  );
}

export default SellerDashboard;
