import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Cuộn cửa sổ lên đầu trang khi pathname thay đổi
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // Component này không hiển thị gì cả, chỉ xử lý logic
};

export default ScrollToTop;