import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import Login from './screens/Login.jsx'
import Layout from './Layout.jsx'
import { Store } from './app/Store.jsx'
import { Provider } from 'react-redux'
import SignUp from './screens/SignUp.jsx'
import BuyerDashboard from './screens/Buyerdash.jsx'
import SellerDashboard from './screens/Sellerdash.jsx'
import PotentialBuyers from './screens/PotentialBuyers.jsx'
import Requests from './screens/Requests.jsx'
import Lightning from './screens/Lightning.jsx'
import MyRequests from './screens/MyRequests.jsx'
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<Layout/>}>
      
      <Route path='/' element={<App/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/signUp' element={<SignUp/>}/>
      <Route path='/buyer' element={<BuyerDashboard/>}/>
          <Route path='/myrequests' element={<MyRequests/>}/>
      <Route/>
      <Route path='/seller' element={<SellerDashboard/>}/>
        <Route path='/requests' element={<Requests/>}/>
      <Route/>
      <Route path='/potentialbuyers' element={<PotentialBuyers/>}/>
      <Route path='/design' element={<Lightning/>}/>
      
      


    </Route>
  )
)
createRoot(document.getElementById('root')).render(
  <Provider store={Store}>
  <RouterProvider router={router} />
  </Provider>,
)
