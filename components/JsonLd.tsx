
import React from 'react';

interface JsonLdProps {
  data: any;
}

/**
 * Componente para injetar dados estruturados JSON-LD no head.
 * Essencial para que o Google entenda a natureza artística e editorial do site.
 */
const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export default JsonLd;
