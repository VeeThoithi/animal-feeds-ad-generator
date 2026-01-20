import { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, X, Copy, Share2, CheckCircle, Facebook, Twitter, MessageCircle, Linkedin, Download } from 'lucide-react';

export default function AIAdGenerator() {
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [productInfo, setProductInfo] = useState({
    productName: "",
    description: "",
    targetAudience: "",
    keyFeatures: ""
  });
  const [adText, setAdText] = useState("");
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adImage, setAdImage] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [error, setError] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const shareMenuRef = useRef(null);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareMenu]);

  const handleGenerateAd = async () => {
    if (!productInfo.productName.trim()) {
      setError('Please enter at least the product name');
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setIsGeneratingAd(true);
    setAdText("");
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          product: productInfo.productName,
          businessType: "animal-feeds",
          format: "short"
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate ad' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      let generatedText = data.caption || data.ad || data.text || data.content;
      
      if (!generatedText || generatedText.trim() === "") {
        throw new Error('No ad text generated');
      }
      
      // Force short format: Take only first 2-3 lines if response is too long
      const lines = generatedText.split('\n').filter(line => line.trim());
      if (lines.length > 3) {
        // Find lines with actual content (not just emojis or hashtags)
        const contentLines = lines.filter(line => 
          !line.startsWith('#') && 
          !line.match(/^[🌾🐥🐓🐄🚜💚🥇]+\s*$/) &&
          line.length > 10
        );
        generatedText = contentLines.slice(0, 2).join('\n') || lines.slice(0, 2).join('\n');
      }
      
      setAdText(generatedText);
      setError("");
    } catch (error) {
      console.error(error);
      const errorMessage = error.message || 'Something went wrong. Please check your connection and try again.';
      setError(errorMessage);
      setAdText(`❌ ${errorMessage}`);
    } finally {
      setIsGeneratingAd(false);
    }
  };

  const handleOpenAdModal = () => {
    setAdModalOpen(true);
    setProductInfo({
      productName: "",
      description: "",
      targetAudience: "",
      keyFeatures: ""
    });
    setAdText("");
    setAdImage("");
    setCopied(false);
    setShowImageModal(false);
    setError("");
  };

  const handleCloseAdModal = () => {
    setAdModalOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(adText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareAd = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Animal Feed Advertisement',
          text: adText
        });
      } catch (error) {
        console.log('Share cancelled');
        copyToClipboard();
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const shareToPlatform = (platform) => {
    if (!adText || adText.includes('❌')) {
      setError('No ad text to share. Please generate an ad first.');
      setTimeout(() => setError(""), 3000);
      setShowShareMenu(false);
      return;
    }

    const encodedText = encodeURIComponent(adText);
    const encodedTitle = encodeURIComponent('Animal Feed Advertisement');
    
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodedText}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodedTitle}&body=${encodedText}`;
        break;
      default:
        copyToClipboard();
        setShowShareMenu(false);
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const handleGenerateImage = async () => {
    if (!productInfo.productName.trim()) {
      setError('Please enter the product name first');
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!adText || adText.includes('❌')) {
      setError('Please generate ad text first');
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsGeneratingImage(true);
    setAdImage("");
    setError("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for image generation

      const response = await fetch("http://localhost:5000/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          product: productInfo.productName,
          adText: adText
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate image' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.imageUrl || data.image;
      
      if (!imageUrl) {
        throw new Error('No image URL returned');
      }
      
      setAdImage(imageUrl);
      setError("");
    } catch (error) {
      console.error(error);
      if (error.name === 'AbortError') {
        setError('Image generation timed out. Please try again.');
      } else {
        setError(error.message || 'Failed to generate image. Please try again.');
      }
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadImage = () => {
    if (!adImage) return;
    const link = document.createElement('a');
    link.href = adImage;
    link.download = `${productInfo.productName.replace(/\s+/g, '-')}-ad.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const shareImage = async () => {
    if (!adImage) return;

    if (navigator.share && navigator.canShare) {
      try {
        // Fetch the image and convert it to a File object
        const response = await fetch(adImage);
        const blob = await response.blob();
        const file = new File([blob], `${productInfo.productName.replace(/\s+/g, '-')}-ad.png`, { type: blob.type });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Animal Feed Ad',
            text: adText || productInfo.productName,
            files: [file]
          });
          return;
        }
      } catch (error) {
        console.error("Sharing failed:", error);
        // Fall through to download or platform sharing
      }
    }
    
    // Fallback: Open share menu or download
    if (adText) {
      shareAd();
    } else {
      downloadImage();
    }
  };

  return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 25%, #a7f3d0 50%, #86efac 75%, #6ee7b7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background elements */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22, 163, 74, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
      <div style={{ maxWidth: '64rem', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '6rem',
            height: '6rem',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
            borderRadius: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(22, 163, 74, 0.3), 0 10px 10px -5px rgba(22, 163, 74, 0.2)',
            marginBottom: '2rem',
            animation: 'float 3s ease-in-out infinite'
          }}>
            <Sparkles style={{ width: '3rem', height: '3rem', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            AI Ad Generator
          </h1>
          <p style={{
            fontSize: 'clamp(1.125rem, 3vw, 1.375rem)',
            color: '#374151',
            marginBottom: '2.5rem',
            maxWidth: '48rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '0 1rem',
            lineHeight: '1.7',
            fontWeight: '400'
          }}>
            Create compelling advertisements for your animal feed products in seconds using AI-powered technology
          </p>
          
          {/* Main CTA Button */}
          <button
            onClick={handleOpenAdModal}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1.25rem 2.5rem',
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: '700',
              border: 'none',
              borderRadius: '1rem',
              boxShadow: '0 20px 25px -5px rgba(22, 163, 74, 0.4), 0 10px 10px -5px rgba(22, 163, 74, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(22, 163, 74, 0.5), 0 15px 15px -5px rgba(22, 163, 74, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(22, 163, 74, 0.4), 0 10px 10px -5px rgba(22, 163, 74, 0.2)';
            }}
          >
            <Sparkles style={{ width: '1.5rem', height: '1.5rem' }} />
            <span>Create Your Ad Now</span>
            <MessageSquare style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          }}
          >
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>AI-Powered</h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.6' }}>Advanced AI creates engaging content tailored to your products</p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          }}
          >
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <MessageSquare style={{ width: '1.5rem', height: '1.5rem', color: '#15803d' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>Ready to Share</h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.6' }}>Copy and share instantly on all your social platforms</p>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          }}
          >
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <CheckCircle style={{ width: '1.5rem', height: '1.5rem', color: '#166534' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>Instant Results</h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.6' }}>Generate professional ads in seconds, not hours</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {adModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '48rem',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            margin: '1rem'
          }}>
            {/* Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: 'linear-gradient(90deg, #16a34a 0%, #15803d 50%, #166534 100%)',
              padding: '1.5rem',
              borderRadius: '1.5rem 1.5rem 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                      Create Your Advertisement
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#d1fae5' }}>Fill in the details below</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseAdModal}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 'clamp(1rem, 4vw, 2rem)' }}>
              {/* Error Message */}
              {error && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fee2e2',
                  border: '2px solid #ef4444',
                  borderRadius: '0.75rem',
                  color: '#991b1b',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              {/* Input Fields */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Product Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Premium Dairy Cattle Feed"
                    value={productInfo.productName}
                    onChange={(e) => setProductInfo({...productInfo, productName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      color: '#111827',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#16a34a';
                      e.target.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateAd}
                disabled={isGeneratingAd || !productInfo.productName.trim()}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: isGeneratingAd || !productInfo.productName.trim() 
                    ? 'linear-gradient(90deg, #d1d5db 0%, #9ca3af 100%)'
                    : 'linear-gradient(90deg, #16a34a 0%, #15803d 50%, #166534 100%)',
                  color: 'white',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  cursor: isGeneratingAd || !productInfo.productName.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease',
                  marginBottom: '1rem'
                }}
              >
                {isGeneratingAd ? (
                  <>
                    <div style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      border: '3px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating Ad Text...
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: '1.25rem', height: '1.25rem' }} />
                    Generate Ad Text
                  </>
                )}
              </button>

              {/* Generate Image Button */}
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !productInfo.productName.trim()}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: isGeneratingImage || !productInfo.productName.trim()
                    ? 'linear-gradient(90deg, #d1d5db 0%, #9ca3af 100%)'
                    : 'linear-gradient(90deg, #059669 0%, #047857 50%, #065f46 100%)',
                  color: 'white',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  cursor: isGeneratingImage || !productInfo.productName.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                {isGeneratingImage ? (
                  <>
                    <div style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      border: '3px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: '1.25rem', height: '1.25rem' }} />
                    Generate Ad Image
                  </>
                )}
              </button>

              {/* Generated Ad Display */}
              {adText && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
                  border: '2px solid #86efac',
                  borderRadius: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: '#d1fae5',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <MessageSquare style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }}>
                        Your Advertisement
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', flexWrap: 'wrap' }}>
                      <button
                        onClick={copyToClipboard}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: 'white',
                          border: '2px solid #16a34a',
                          color: '#15803d',
                          borderRadius: '0.5rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {copied ? <CheckCircle style={{ width: '1rem', height: '1rem' }} /> : <Copy style={{ width: '1rem', height: '1rem' }} />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <div style={{ position: 'relative' }} ref={shareMenuRef}>
                        <button
                          onClick={shareAd}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#16a34a',
                            border: 'none',
                            color: 'white',
                            borderRadius: '0.5rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                        >
                          <Share2 style={{ width: '1rem', height: '1rem' }} />
                          Share
                        </button>
                        {showShareMenu && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            backgroundColor: 'white',
                            borderRadius: '0.75rem',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '0.75rem',
                            minWidth: '200px',
                            zIndex: 100,
                            border: '1px solid #e5e7eb'
                          }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '0.5rem'
                            }}>
                              <button
                                onClick={() => shareToPlatform('facebook')}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.borderColor = '#3b82f6';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                                title="Share on Facebook"
                              >
                                <Facebook style={{ width: '1.5rem', height: '1.5rem', color: '#1877f2' }} />
                                <span style={{ fontSize: '0.75rem', color: '#374151' }}>Facebook</span>
                              </button>
                              <button
                                onClick={() => shareToPlatform('twitter')}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.borderColor = '#1da1f2';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                                title="Share on Twitter/X"
                              >
                                <Twitter style={{ width: '1.5rem', height: '1.5rem', color: '#1da1f2' }} />
                                <span style={{ fontSize: '0.75rem', color: '#374151' }}>Twitter</span>
                              </button>
                              <button
                                onClick={() => shareToPlatform('whatsapp')}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.borderColor = '#25d366';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                                title="Share on WhatsApp"
                              >
                                <MessageCircle style={{ width: '1.5rem', height: '1.5rem', color: '#25d366' }} />
                                <span style={{ fontSize: '0.75rem', color: '#374151' }}>WhatsApp</span>
                              </button>
                              <button
                                onClick={() => shareToPlatform('linkedin')}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.borderColor = '#0077b5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                                title="Share on LinkedIn"
                              >
                                <Linkedin style={{ width: '1.5rem', height: '1.5rem', color: '#0077b5' }} />
                                <span style={{ fontSize: '0.75rem', color: '#374151' }}>LinkedIn</span>
                              </button>
                              <button
                                onClick={() => shareToPlatform('telegram')}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.borderColor = '#0088cc';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                                title="Share on Telegram"
                              >
                                <MessageCircle style={{ width: '1.5rem', height: '1.5rem', color: '#0088cc' }} />
                                <span style={{ fontSize: '0.75rem', color: '#374151' }}>Telegram</span>
                              </button>
                              <button
                                onClick={() => shareToPlatform('email')}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.75rem',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                                  e.currentTarget.style.borderColor = '#6b7280';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                                title="Share via Email"
                              >
                                <MessageSquare style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
                                <span style={{ fontSize: '0.75rem', color: '#374151' }}>Email</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    padding: '1rem',
                    backgroundColor: 'white',
                    borderRadius: '0.75rem',
                    color: adText.includes('❌') ? '#dc2626' : '#1f2937',
                    fontStyle: adText.includes('❌') ? 'italic' : 'normal'
                  }}>
                    {adText}
                  </div>
                </div>
              )}

              {/* Generated Image Display */}
              {adImage && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '2px solid #6ee7b7',
                  borderRadius: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }}>
                      🎨 Your Ad Image
                    </h3>
                    <button
                        onClick={shareImage}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: 'white',
                          border: '2px solid #16a34a',
                          color: '#15803d',
                          borderRadius: '0.5rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <Share2 style={{ width: '1rem', height: '1rem' }} />
                        Share
                      </button>
                    <button
                      onClick={downloadImage}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#16a34a',
                        border: 'none',
                        color: 'white',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                    >
                      Download
                    </button>
                  </div>
                  <img 
                    src={adImage} 
                    alt="Generated advertisement" 
                    style={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "600px",
                      objectFit: "contain",
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#f9fafb',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onClick={() => setShowImageModal(true)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      setError('Failed to load image. Please try generating again.');
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal/Fullscreen View */}
      {showImageModal && adImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={() => setShowImageModal(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                position: 'absolute',
                top: '-3rem',
                right: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                zIndex: 1001
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>

            {/* Full Size Image */}
            <img
              src={adImage}
              alt="Full size advertisement"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: '1rem',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
            />

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  downloadImage();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#16a34a',
                  border: 'none',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
              >
                <Download style={{ width: '1.25rem', height: '1.25rem' }} />
                Download
              </button>
              <button
                onClick={() => {
                  shareImage();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                <Share2 style={{ width: '1.25rem', height: '1.25rem' }} />
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @media (max-width: 640px) {
          body {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}