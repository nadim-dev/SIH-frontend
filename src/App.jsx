import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css'
import { InstrumentRegister } from './pages/InstrumentRegisteration';



const router=createBrowserRouter([
  {
     path:"/",
     element:<InstrumentRegister/>
  }

])

function App() {
  return <RouterProvider router={router} />;
}

export default App
