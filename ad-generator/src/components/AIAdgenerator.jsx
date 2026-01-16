import { useState } from 'react';
import { Sparkles, MessageSquare, X, Copy, Share2, CheckCircle } from 'lucide-react';

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

  const handleGenerateAd = async () => {
    if (!productInfo.productName.trim()) {
      alert('Please enter at least the product name');
      return;
    }
    
    setIsGeneratingAd(true);
    setAdText("");
    
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
      
      if (!response.ok) throw new Error('Failed to generate ad');
      
      const data = await response.json();
      let generatedText = data.caption || data.ad || data.text || data.content;
      
      // Force short format: Take only first 2-3 lines if response is too long
      const lines = generatedText.split('\n').filter(line => line.trim());
      if (lines.length > 3) {
        // Find lines with actual content (not just emojis or hashtags)
        const contentLines = lines.filter(line => 
          !line.startsWith('#') && 
          !line.match(/^[🌾🐥🐓🐄🚜💚🥇]+\s*$/) &&
          line.length > 10
        );
        generatedText = contentLines.slice(0, 2).join('\n');
      }
      
      setAdText(generatedText);
    } catch (error) {
      console.error(error);
      setAdText("❌ Something went wrong. Please check your connection and try again.");
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
      copyToClipboard();
    }
  };

  const handleGenerateImage = async () => {
    if (!productInfo.productName.trim()) {
      alert('Please enter the product name first');
      return;
    }

    if (!adText || adText.includes('❌')) {
      alert('Please generate ad text first');
      return;
    }

    setIsGeneratingImage(true);
    setAdImage("");

    try {
      const response = await fetch("http://localhost:5000/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          product: productInfo.productName,
          adText: adText
        }),
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      setAdImage(data.imageUrl || data.image);
    } catch (error) {
      console.error(error);
      alert("Failed to generate image. Please try again.");
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

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [] })) {
    try {
      // Fetch the image and convert it to a File object
      const response = await fetch(adImage);
      const blob = await response.blob();
      const file = new File([blob], `${productInfo.productName.replace(/\s+/g, '-')}-ad.png`, { type: blob.type });

      await navigator.share({
        title: 'Animal Feed Ad',
        text: adText,
        files: [file]
      });
    } catch (error) {
      console.error("Sharing failed:", error);
      downloadImage(); // fallback if share fails
    }
  } else {
    downloadImage(); // fallback for browsers without share support
  }
};

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 50%, #bbf7d0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '64rem', width: '100%' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '5rem',
            height: '5rem',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            borderRadius: '1rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
          }}>
            <Sparkles style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
          </div>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            AI Ad Generator
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#4b5563',
            marginBottom: '2rem',
            maxWidth: '42rem',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Create compelling advertisements for your animal feed products in seconds using AI
          </p>
          
          {/* Main CTA Button */}
          <button
            onClick={handleOpenAdModal}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 2rem',
              background: 'linear-gradient(90deg, #16a34a 0%, #15803d 50%, #166534 100%)',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '0.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'box-shadow 0.3s ease'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              backgroundColor: '#d1fae5',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>AI-Powered</h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Advanced AI creates engaging content tailored to your products</p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'box-shadow 0.3s ease'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              backgroundColor: '#bbf7d0',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <MessageSquare style={{ width: '1.5rem', height: '1.5rem', color: '#15803d' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Ready to Share</h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Copy and share instantly on all your social platforms</p>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'box-shadow 0.3s ease'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              backgroundColor: '#a7f3d0',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <CheckCircle style={{ width: '1.5rem', height: '1.5rem', color: '#166534' }} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Instant Results</h3>
            <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Generate professional ads in seconds, not hours</p>
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
            overflowY: 'auto'
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
            <div style={{ padding: '2rem' }}>
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                      width: "100%",          // scale to fit container width
                      height: "auto",         // keep proportions
                      objectFit: "contain",
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}