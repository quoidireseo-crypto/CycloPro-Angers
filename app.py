import React from 'react';

const ArtisanCard = () => {
  // Couleurs : Ivoire (#FFFFF0) et Terre d'ombre (#735C44)
  const styles = {
    card: {
      backgroundColor: '#FFFFF0',
      border: '2px solid #735C44',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '400px',
      color: '#735C44',
      fontFamily: 'sans-serif',
      boxShadow: '0 4px 15px rgba(115, 92, 68, 0.1)',
      margin: '20px auto'
    },
    badge: {
      backgroundColor: '#735C44',
      color: '#FFFFF0',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      textTransform: 'uppercase' as const,
      display: 'inline-block',
      marginBottom: '12px'
    },
    title: {
      margin: '0 0 8px 0',
      fontSize: '1.5rem',
      fontWeight: '700'
    },
    description: {
      fontSize: '0.95rem',
      lineHeight: '1.5',
      marginBottom: '16px'
    },
    stats: {
      borderTop: '1px solid #735C44',
      paddingTop: '12px',
      fontSize: '0.85rem',
      display: 'flex',
      justifyContent: 'space-between',
      opacity: 0.9
    },
    button: {
      display: 'block',
      textAlign: 'center' as const,
      backgroundColor: '#735C44',
      color: '#FFFFF0',
      textDecoration: 'none',
      padding: '10px',
      borderRadius: '8px',
      marginTop: '15px',
      fontWeight: 'bold'
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.badge}>Plomberie Écolo</div>
      <h2 style={styles.title}>Jean La Fuite</h2>
      <p style={styles.description}>
        Artisan plombier à Angers. Je me déplace exclusivement en vélo-cargo 
        pour vos dépannages en centre-ville. 0 émission, 100% efficacité.
      </p>
      <div style={styles.stats}>
<span>\U0001F4E6 Capacité : 150kg</span>        <span>⭐ 4.9 (28 avis)</span>
      </div>
      <a href="tel:0241000000" style={styles.button}>
        Contacter par téléphone
      </a>
    </div>
  );
};

export default ArtisanCard;
