import React, { useState, useMemo } from 'react';
import { Button, InputGroup, MenuItem, Card, Icon } from '@blueprintjs/core';
import { Select, ItemRenderer } from '@blueprintjs/select';
import { useTheme } from '@/contexts/ThemeProvider';
import { usePanelStore } from '@/stores/panelStore';
import { useCanvasStore } from '@/stores/canvasStore';

// Quote categories
const QUOTE_CATEGORIES = [
  { value: 'all', label: 'All Quotes' },
  { value: 'motivation', label: 'Motivation' },
  { value: 'success', label: 'Success' },
  { value: 'wisdom', label: 'Wisdom' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'life', label: 'Life' },
  { value: 'business', label: 'Business' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'leadership', label: 'Leadership' }
];

// Curated quotes collection
const QUOTES_COLLECTION = [
  // Motivation
  { id: 'mot_1', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'motivation', tags: ['work', 'passion', 'success'] },
  { id: 'mot_2', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'motivation', tags: ['perseverance', 'courage'] },
  { id: 'mot_3', text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson', category: 'motivation', tags: ['persistence', 'time'] },
  { id: 'mot_4', text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'motivation', tags: ['dreams', 'future'] },

  // Success
  { id: 'suc_1', text: 'Success is walking from failure to failure with no loss of enthusiasm.', author: 'Winston Churchill', category: 'success', tags: ['failure', 'enthusiasm'] },
  { id: 'suc_2', text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney', category: 'success', tags: ['action', 'start'] },
  { id: 'suc_3', text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs', category: 'success', tags: ['innovation', 'leadership'] },

  // Wisdom
  { id: 'wis_1', text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle', category: 'wisdom', tags: ['hope', 'perspective'] },
  { id: 'wis_2', text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates', category: 'wisdom', tags: ['humility', 'learning'] },
  { id: 'wis_3', text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein', category: 'wisdom', tags: ['opportunity', 'challenge'] },

  // Inspirational
  { id: 'ins_1', text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde', category: 'inspirational', tags: ['authenticity', 'self'] },
  { id: 'ins_2', text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky', category: 'inspirational', tags: ['opportunity', 'risk'] },
  { id: 'ins_3', text: 'Whether you think you can or you think you can\'t, you\'re right.', author: 'Henry Ford', category: 'inspirational', tags: ['mindset', 'belief'] },

  // Life
  { id: 'lif_1', text: 'Life is what happens to you while you\'re busy making other plans.', author: 'John Lennon', category: 'life', tags: ['present', 'plans'] },
  { id: 'lif_2', text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama', category: 'life', tags: ['happiness', 'purpose'] },
  { id: 'lif_3', text: 'In the end, we will remember not the words of our enemies, but the silence of our friends.', author: 'Martin Luther King Jr.', category: 'life', tags: ['friendship', 'support'] },

  // Business
  { id: 'bus_1', text: 'Your most unhappy customers are your greatest source of learning.', author: 'Bill Gates', category: 'business', tags: ['customer', 'learning'] },
  { id: 'bus_2', text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb', category: 'business', tags: ['timing', 'action'] },
  { id: 'bus_3', text: 'Don\'t be afraid to give up the good to go for the great.', author: 'John D. Rockefeller', category: 'business', tags: ['excellence', 'improvement'] },

  // Creativity
  { id: 'cre_1', text: 'Creativity is intelligence having fun.', author: 'Albert Einstein', category: 'creativity', tags: ['intelligence', 'fun'] },
  { id: 'cre_2', text: 'The secret to creativity is knowing how to hide your sources.', author: 'Pablo Picasso', category: 'creativity', tags: ['inspiration', 'originality'] },
  { id: 'cre_3', text: 'You can\'t use up creativity. The more you use, the more you have.', author: 'Maya Angelou', category: 'creativity', tags: ['abundance', 'practice'] },

  // Leadership
  { id: 'lea_1', text: 'A leader is one who knows the way, goes the way, and shows the way.', author: 'John C. Maxwell', category: 'leadership', tags: ['guidance', 'example'] },
  { id: 'lea_2', text: 'The art of leadership is saying no, not yes. It is very easy to say yes.', author: 'Tony Blair', category: 'leadership', tags: ['decisions', 'priorities'] },
  { id: 'lea_3', text: 'Management is doing things right; leadership is doing the right things.', author: 'Peter Drucker', category: 'leadership', tags: ['management', 'direction'] }
];

const CategorySelect = Select.ofType<{ value: string; label: string }>();

const renderCategory: ItemRenderer<{ value: string; label: string }> = (
  category,
  { handleClick, modifiers }
) => {
  return (
    <MenuItem
      active={modifiers.active}
      key={category.value}
      onClick={handleClick}
      text={category.label}
    />
  );
};

export const QuotesPanel: React.FC = () => {
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery } = usePanelStore();
  const { addElement } = useCanvasStore();
  const [selectedCategory, setSelectedCategory] = useState(QUOTE_CATEGORIES[0]);

  const filteredQuotes = useMemo(() => {
    return QUOTES_COLLECTION.filter(quote => {
      // Category filter
      if (selectedCategory.value !== 'all' && quote.category !== selectedCategory.value) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          quote.text.toLowerCase().includes(query) ||
          quote.author.toLowerCase().includes(query) ||
          quote.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleQuoteClick = (quote: any) => {
    // Create a formatted text element with the quote
    const quoteText = `"${quote.text}"\n\n— ${quote.author}`;
    
    const element = {
      id: `quote_${quote.id}_${Date.now()}`,
      type: 'text' as const,
      x: 100,
      y: 100,
      width: 400,
      height: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      text: quoteText,
      fontFamily: 'Playfair Display, Georgia, serif',
      fontSize: 18,
      fontWeight: '400',
      fontStyle: 'normal',
      textAlign: 'center',
      verticalAlign: 'middle',
      color: '#2D3748',
      lineHeight: 1.6,
      letterSpacing: 0,
      textDecoration: 'none',
      textTransform: 'none',
      wordWrap: true,
      isQuote: true,
      quoteAuthor: quote.author,
      quoteCategory: quote.category
    };
    
    addElement(element);
  };

  const generateRandomQuote = () => {
    if (filteredQuotes.length > 0) {
      const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
      handleQuoteClick(randomQuote);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Search and Filters */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <InputGroup
          leftIcon="search"
          placeholder="Search quotes, authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          rightElement={
            searchQuery ? (
              <Button
                icon="cross"
                minimal
                onClick={() => setSearchQuery('')}
              />
            ) : undefined
          }
          style={{ marginBottom: '12px' }}
        />
        
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '12px',
            color: theme.colors?.textSecondary || '#a7b6c2',
            marginRight: '4px'
          }}>
            Category:
          </span>
          
          <CategorySelect
            items={QUOTE_CATEGORIES}
            itemRenderer={renderCategory}
            onItemSelect={(category) => setSelectedCategory(category)}
            filterable={false}
          >
            <Button
              text={selectedCategory.label}
              rightIcon="caret-down"
              minimal
              small
            />
          </CategorySelect>
        </div>

        {/* Random Quote Button */}
        <Button
          onClick={generateRandomQuote}
          disabled={filteredQuotes.length === 0}
          fill
          icon="random"
          intent="primary"
          text="Add Random Quote"
        />
      </div>

      {/* Quotes List */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto'
      }}>
        {filteredQuotes.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: theme.colors?.textSecondary || '#a7b6c2',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            <div>
              <Icon icon="citation" size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div>No quotes found</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Try adjusting your search or category filter
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredQuotes.map((quote) => (
              <Card
                key={quote.id}
                interactive
                onClick={() => handleQuoteClick(quote)}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: theme.colors?.cardBg || '#394b59',
                  border: `1px solid ${theme.colors?.border || '#495563'}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors?.primary || '#48aff0';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors?.border || '#495563';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Quote Text */}
                <div style={{
                  fontSize: '14px',
                  fontStyle: 'italic',
                  color: theme.colors?.textPrimary || '#f5f8fa',
                  lineHeight: '1.5',
                  marginBottom: '12px',
                  position: 'relative'
                }}>
                  <span style={{
                    fontSize: '20px',
                    color: theme.colors?.primary || '#48aff0',
                    position: 'absolute',
                    top: '-2px',
                    left: '-8px'
                  }}>
                    "
                  </span>
                  <span style={{ marginLeft: '8px' }}>
                    {quote.text}
                  </span>
                  <span style={{
                    fontSize: '20px',
                    color: theme.colors?.primary || '#48aff0'
                  }}>
                    "
                  </span>
                </div>

                {/* Author */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: theme.colors?.textSecondary || '#a7b6c2'
                  }}>
                    — {quote.author}
                  </div>
                  
                  <div style={{
                    fontSize: '10px',
                    color: theme.colors?.textSecondary || '#a7b6c2',
                    backgroundColor: theme.colors?.bg || '#30404d',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    textTransform: 'capitalize'
                  }}>
                    {quote.category}
                  </div>
                </div>

                {/* Tags */}
                {quote.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {quote.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: '9px',
                          color: theme.colors?.textSecondary || '#a7b6c2',
                          backgroundColor: 'rgba(72, 175, 240, 0.1)',
                          border: '1px solid rgba(72, 175, 240, 0.3)',
                          padding: '1px 4px',
                          borderRadius: '8px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme.colors?.border || '#495563'}`,
        fontSize: '10px',
        color: theme.colors?.textSecondary || '#a7b6c2',
        textAlign: 'center'
      }}>
        {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''} available
        {selectedCategory.value !== 'all' && ` in ${selectedCategory.label}`}
      </div>
    </div>
  );
};

QuotesPanel.displayName = 'QuotesPanel';