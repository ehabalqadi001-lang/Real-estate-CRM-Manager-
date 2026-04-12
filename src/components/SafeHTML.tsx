import DOMPurify from 'isomorphic-dompurify';
import React from 'react';

interface SafeHTMLProps {
  htmlContent: string;
  className?: string;
}

export default function SafeHTML({ htmlContent, className }: SafeHTMLProps) {
  // 1. غسل الكود: إزالة أي <script> أو أكواد خبيثة، والسماح بالتنسيقات الآمنة فقط (Bold, Colors, Tables...)
  const cleanHTML = DOMPurify.sanitize(htmlContent, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'style', 'class'],
  });

  // 2. العرض الآمن
  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={{ __html: cleanHTML }} 
    />
  );
}