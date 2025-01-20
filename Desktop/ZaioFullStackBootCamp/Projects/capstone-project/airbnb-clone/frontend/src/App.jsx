import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Listing from "./pages/Listing";
import Location from "./pages/Locations";
import Login from "./pages/Login";
import Locations from "./pages/Locations";

const App = () => {
  return (
    <div className="px-4 sm:px=[5vw] md:px-[7vw] lg:px-[9vw]">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
};

export default App;
