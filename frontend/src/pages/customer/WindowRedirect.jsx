import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WindowRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Defaulting to 'spice-lounge' and table '0' for Window Pickup
    navigate('/menu?restaurant=spice-lounge&table=0');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-vh-100 bg-white">
      <div className="w-10 h-10 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default WindowRedirect;
