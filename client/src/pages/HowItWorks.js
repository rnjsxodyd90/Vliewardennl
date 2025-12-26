import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HowItWorks = () => {
  const { user } = useAuth();

  const Section = ({ icon, title, children }) => (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        <h2 style={{ margin: 0, color: '#333' }}>{title}</h2>
      </div>
      {children}
    </div>
  );

  const FeatureCard = ({ icon, title, description }) => (
    <div style={{
      background: '#f8f9fa',
      borderRadius: '12px',
      padding: '1.25rem',
      flex: '1 1 250px'
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h4 style={{ margin: '0 0 0.5rem', color: '#333' }}>{title}</h4>
      <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{description}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        background: 'linear-gradient(135deg, #ff6f0f 0%, #ff9248 100%)',
        borderRadius: '20px',
        marginBottom: '2rem',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem' }}>
          Welcome to Vliewarden NL 🇳🇱
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.95, maxWidth: '600px', margin: '0 auto' }}>
          Your local marketplace and community hub for expats in the Netherlands
        </p>
      </div>

      {/* What is this */}
      <Section icon="🏠" title="What is Vliewarden?">
        <p style={{ color: '#555', lineHeight: 1.7, fontSize: '1.05rem' }}>
          Vliewarden is a platform built <strong>by expats, for expats</strong> living in the Netherlands. 
          Whether you're looking to buy or sell items, find services, or connect with your local community, 
          we've got you covered.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
          <FeatureCard 
            icon="🛒" 
            title="Marketplace" 
            description="Buy and sell items, find jobs, housing, and services in your area."
          />
          <FeatureCard 
            icon="💬" 
            title="Community" 
            description="Share experiences, ask questions, and connect with fellow expats."
          />
          <FeatureCard 
            icon="📍" 
            title="Local Focus" 
            description="Filter by city and district to find what's near you."
          />
        </div>
      </Section>

      {/* Warmth System */}
      <Section icon="🌡️" title="The Warmth System">
        <p style={{ color: '#555', lineHeight: 1.7 }}>
          Instead of traditional star ratings, we use a unique <strong>"body warmth"</strong> reputation system. 
          Every user starts at <strong>36.5°C</strong> (normal body temperature).
        </p>
        
        <div style={{
          background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8db 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          margin: '1.5rem 0'
        }}>
          <h4 style={{ margin: '0 0 1rem', color: '#e85d04' }}>How it works:</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#555' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Upvotes</strong> on your posts add <span style={{ color: '#28a745' }}>+0.01°C</span> to your warmth
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Downvotes</strong> on your posts subtract <span style={{ color: '#dc3545' }}>-0.01°C</span> from your warmth
            </li>
            <li>
              The warmer you are, the more trusted you become in the community!
            </li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ 
            flex: '1 1 200px', 
            padding: '1rem', 
            background: '#e3f2fd', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem' }}>❄️</div>
            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>&lt; 36.5°C</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Cold (more downvotes)</div>
          </div>
          <div style={{ 
            flex: '1 1 200px', 
            padding: '1rem', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem' }}>🌡️</div>
            <div style={{ fontWeight: 'bold', color: '#666' }}>36.5°C</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Neutral (new users)</div>
          </div>
          <div style={{ 
            flex: '1 1 200px', 
            padding: '1rem', 
            background: '#fff3e0', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem' }}>🔥</div>
            <div style={{ fontWeight: 'bold', color: '#e65100' }}>&gt; 37°C</div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Hot (trusted member!)</div>
          </div>
        </div>
      </Section>

      {/* Marketplace */}
      <Section icon="🛍️" title="Using the Marketplace">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ 
              background: '#ff6f0f', 
              color: 'white', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}>1</span>
            <div>
              <h4 style={{ margin: '0 0 0.25rem' }}>Create an account</h4>
              <p style={{ margin: 0, color: '#666' }}>Sign up for free to start posting and interacting with the community.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ 
              background: '#ff6f0f', 
              color: 'white', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}>2</span>
            <div>
              <h4 style={{ margin: '0 0 0.25rem' }}>Post your listing</h4>
              <p style={{ margin: 0, color: '#666' }}>Add photos, description, price, and your contact info. Choose your city and category.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ 
              background: '#ff6f0f', 
              color: 'white', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}>3</span>
            <div>
              <h4 style={{ margin: '0 0 0.25rem' }}>Connect with buyers</h4>
              <p style={{ margin: 0, color: '#666' }}>Receive messages via comments or direct contact (email, phone, WhatsApp).</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ 
              background: '#ff6f0f', 
              color: 'white', 
              borderRadius: '50%', 
              width: '32px', 
              height: '32px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}>4</span>
            <div>
              <h4 style={{ margin: '0 0 0.25rem' }}>Mark as sold</h4>
              <p style={{ margin: 0, color: '#666' }}>Once you've completed the transaction, mark your listing as sold.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Community */}
      <Section icon="👥" title="Join the Community">
        <p style={{ color: '#555', lineHeight: 1.7 }}>
          The Community section is where expats share their experiences, ask questions, 
          and help each other navigate life in the Netherlands.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
          <FeatureCard 
            icon="📝" 
            title="Write Articles" 
            description="Share your experiences, tips, and stories with the community."
          />
          <FeatureCard 
            icon="👍" 
            title="Vote & Comment" 
            description="Upvote helpful content and join discussions."
          />
          <FeatureCard 
            icon="🔍" 
            title="Find Answers" 
            description="Search for advice from people who've been in your shoes."
          />
        </div>
      </Section>

      {/* Safety */}
      <Section icon="🛡️" title="Safety & Reporting">
        <p style={{ color: '#555', lineHeight: 1.7 }}>
          We want Vliewarden to be a safe and trustworthy community. Here's how we keep it that way:
        </p>
        <ul style={{ color: '#555', lineHeight: 1.8 }}>
          <li><strong>Report inappropriate content</strong> — Use the 🚩 Report button on any post or comment</li>
          <li><strong>Check warmth ratings</strong> — Higher temperature = more trusted community member</li>
          <li><strong>Meet in public places</strong> — When meeting for transactions, choose safe locations</li>
          <li><strong>Trust your instincts</strong> — If something seems off, don't proceed</li>
        </ul>
      </Section>

      {/* Categories */}
      <Section icon="📂" title="What Can You Find?">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
          gap: '0.75rem',
          marginTop: '0.5rem'
        }}>
          {[
            { icon: '🏠', name: 'Housing' },
            { icon: '💼', name: 'Jobs' },
            { icon: '🔧', name: 'Services' },
            { icon: '🛒', name: 'Items for Sale' },
            { icon: '📱', name: 'Electronics' },
            { icon: '🪑', name: 'Furniture' },
            { icon: '🚗', name: 'Vehicles' },
            { icon: '🎉', name: 'Events' },
            { icon: '📦', name: 'Other' }
          ].map(cat => (
            <div key={cat.name} style={{
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{cat.icon}</div>
              <div style={{ fontSize: '0.85rem', color: '#333' }}>{cat.name}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '20px',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 1rem', color: '#333' }}>Ready to get started?</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Join thousands of expats buying, selling, and connecting in the Netherlands.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <>
              <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                Browse Marketplace
              </Link>
              <Link to="/community" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>
                Explore Community
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                Create Free Account
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.75rem 2rem' }}>
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;

