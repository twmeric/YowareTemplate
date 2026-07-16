import React from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  tag?: string;
}

interface ProductCardProps {
  product: Product;
  whatsappNumber: string;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, whatsappNumber, onAddToCart }) => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`我想查詢/訂購 ${product.name}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
        {product.tag && (
          <span className="absolute top-2 left-2 bg-brand-green text-white text-xs px-2 py-1 rounded">
            {product.tag}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{product.category}</p>
        <h3 className="text-lg font-medium text-brand-green mb-2 line-clamp-2 h-14">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-brand-red font-bold text-xl">
            HK$ {product.price}
          </span>
          {product.originalPrice && (
            <span className="text-gray-400 text-sm line-through">
              HK$ {product.originalPrice}
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={handleWhatsAppClick}
            className="w-full bg-brand-green text-white py-2 rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            WhatsApp 立即訂購
          </button>
          
          {/* 
            Future E-commerce Button:
            <button 
              onClick={() => onAddToCart?.(product)}
              className="w-full border border-brand-green text-brand-green py-2 rounded-md hover:bg-brand-green hover:text-white transition-colors text-sm"
            >
              加入購物車
            </button>
          */}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
