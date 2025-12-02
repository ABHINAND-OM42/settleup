const Footer = () => {
  return (
    <footer className="bg-white text-center py-3 mt-auto border-top">
      <div className="container">
        <small className="text-muted">
          &copy; {new Date().getFullYear()} <strong>SettleUp</strong>. All rights reserved.
        </small>
      </div>
    </footer>
  );
};

export default Footer;