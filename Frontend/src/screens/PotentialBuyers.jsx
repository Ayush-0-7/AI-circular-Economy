import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchPotentialBuyers } from './Gemini'; // Import the fetchPotentialBuyers function

const PotentialBuyers = () => {
  const location = useLocation(); // Get location object
  const { productName, productCategory } = location.state; // Get productName and productCategory from state
  const [buyers, setBuyers] = useState([]); // State to store potential buyers
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        let buyersData = await fetchPotentialBuyers(productName, productCategory); // Fetch potential buyers

        // Check if the data is in string format
        if (typeof buyersData === 'string') {
          // Remove any backticks and trim any surrounding extra text
          buyersData = buyersData.replace(/```/g, '').trim();

          // Find the first occurrence of valid JSON (an array structure)
          const jsonStartIndex = buyersData.indexOf('[');
          const jsonEndIndex = buyersData.lastIndexOf(']') + 1; // Include the last bracket

          // Extract the JSON string if valid array is found
          if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            const jsonString = buyersData.substring(jsonStartIndex, jsonEndIndex);
            buyersData = JSON.parse(jsonString); // Parse the extracted JSON
          } else {
            throw new Error('No valid JSON array found in the response');
          }
        }

        // Now map the data to the proper format
        const mappedBuyers = buyersData.map((buyer) => ({
          name: buyer.name, // Use name for display
          websiteLink: buyer.website, // Use website for the link
        }));

        setBuyers(mappedBuyers); // Update state with the formatted buyers data
      } catch (error) {
        console.error('Error fetching potential buyers: ', error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchBuyers();
  }, [productName, productCategory]);

  return (
    <div className="potential-buyers-container p-4">
      <h1 className="text-3xl font-bold mb-6">Potential Buyers for {location.state.productName}</h1>

      {loading ? (
        <p>Loading...</p> // Display loading text while fetching data
      ) : buyers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left text-sm font-semibold">Buyer Name</th>
                <th className="py-2 px-4 border-b text-left text-sm font-semibold">Website</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((buyer, index) => (
                <tr key={index}>
                  <td className="py-2 px-4 border-b">{buyer.name}</td>
                  <td className="py-2 px-4 border-b">
                    <a href={buyer.websiteLink} target="_blank" rel="noreferrer noopener" className="text-blue-500 underline">
                      {buyer.websiteLink}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No potential buyers found for this product.</p> // Message when no buyers are found
      )}
    </div>
  );
};

export default PotentialBuyers;
