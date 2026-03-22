import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const WindowRedirect = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Defaulting to the base /menu which now defaults to Window Pickup
    navigate('/menu');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-vh-100 bg-white">
      <div className="w-10 h-10 border-4 border-customer-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default WindowRedirect;
