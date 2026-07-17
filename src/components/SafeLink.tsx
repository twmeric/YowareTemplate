import React from "react";
import { Link } from "react-router-dom";

interface SafeLinkProps {
  to: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * 同時支援內部 React Router 路徑與外部網址。
 * 外部網址會以 <a target="_blank" rel="noopener noreferrer"> 開啟。
 */
const SafeLink: React.FC<SafeLinkProps> = ({ to, className, children }) => {
  if (
    to.startsWith("http://") ||
    to.startsWith("https://") ||
    to.startsWith("//")
  ) {
    return (
      <a
        href={to}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
};

export default SafeLink;
