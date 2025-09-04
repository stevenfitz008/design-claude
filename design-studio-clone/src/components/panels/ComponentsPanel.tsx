import React, { useEffect, useState, useCallback } from 'react';
import { observer } from "mobx-react-lite";
import { FaPlus, FaSearch, FaFilter, FaCubes, FaCube, FaEdit, FaTrash, FaCopy, FaTag, FaUsers, FaCode, FaDownload } from '@meronex/icons/fa';
import type { Component } from '../../services/componentsService';

interface ComponentsPanelProps {
  className?: string;
}

const PanelContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    height: '100%',
    width: '100%',
    backgroundColor: '#2f343c',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }}>
    {children}
  </div>
);

const PanelHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    padding: '16px',
    borderBottom: '1px solid #495563',
    backgroundColor: '#252a30',
    flexShrink: 0
  }}>
    {children}
  </div>
);

const PanelContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    flex: 1,
    overflow: 'auto',
    minHeight: 0
  }}>
    {children}
  </div>
);

const FilterButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 12px',
      backgroundColor: active ? '#48aff0' : 'transparent',
      color: active ? 'white' : '#a7b6c2',
      border: `1px solid ${active ? '#48aff0' : '#495563'}`,
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}
  >
    {children}
  </button>
);

const ComponentCard: React.FC<{
  component: Component;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddToPage: () => void;
}> = ({ component, onSelect, onEdit, onDelete, onDuplicate, onAddToPage }) => (
  <div
    onClick={onSelect}
    style={{
      padding: '12px',
      margin: '8px',
      backgroundColor: '#252a30',
      border: '1px solid #495563',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#1a1d23';
      e.currentTarget.style.borderColor = '#5a6c7d';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#252a30';
      e.currentTarget.style.borderColor = '#495563';
    }}
  >
    {/* Component preview */}
    <div style={{
      width: '100%',
      height: '60px',
      backgroundColor: '#495563',
      borderRadius: '4px',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: component.thumbnail 
        ? `url(${component.thumbnail}) center/cover`
        : '#495563'
    }}>
      {!component.thumbnail && (
        <FaCube size={24} color="#8a9ba8" />
      )}
    </div>
    
    {/* Component info */}
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '4px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: '600',
          color: '#f5f8fa',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {component.name}
        </h4>
        
        {component.isSystem && (
          <span style={{
            fontSize: '10px',
            color: '#48aff0',
            background: 'rgba(72, 175, 240, 0.1)',
            padding: '2px 6px',
            borderRadius: '2px',
            border: '1px solid rgba(72, 175, 240, 0.3)'
          }}>
            SYSTEM
          </span>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: '#8a9ba8',
        marginBottom: '6px'
      }}>
        <span>{component.type}</span>
        <span>•</span>
        <span>{component.category}</span>
        <span>•</span>
        <span>v{component.version}</span>
      </div>
      
      {/* Tags */}
      {component.tags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: '6px'
        }}>
          {component.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              style={{
                fontSize: '10px',
                color: '#8a9ba8',
                background: '#495563',
                padding: '1px 4px',
                borderRadius: '2px'
              }}
            >
              {tag}
            </span>
          ))}
          {component.tags.length > 3 && (
            <span style={{
              fontSize: '10px',
              color: '#8a9ba8'
            }}>
              +{component.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      {/* Usage stats */}
      <div style={{
        fontSize: '11px',
        color: '#8a9ba8'
      }}>
        <FaDownload size={10} style={{ marginRight: '4px' }} />
        {component.usageCount} uses
      </div>
    </div>
    
    {/* Action buttons */}
    <div style={{
      display: 'flex',
      gap: '4px'
    }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToPage();
        }}
        style={{
          flex: 1,
          padding: '6px 8px',
          backgroundColor: '#48aff0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Add to Page
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        style={{
          padding: '6px',
          backgroundColor: 'transparent',
          color: '#a7b6c2',
          border: '1px solid #495563',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        title="Edit"
      >
        <FaEdit size={12} />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        style={{
          padding: '6px',
          backgroundColor: 'transparent',
          color: '#a7b6c2',
          border: '1px solid #495563',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        title="Duplicate"
      >
        <FaCopy size={12} />
      </button>
      
      {!component.isSystem && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: '6px',
            backgroundColor: 'transparent',
            color: '#dc3545',
            border: '1px solid #495563',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Delete"
        >
          <FaTrash size={12} />
        </button>
      )}
    </div>
  </div>
);

export const ComponentsPanel: React.FC<ComponentsPanelProps> = observer(({ className }) => {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showSystemOnly, setShowSystemOnly] = useState(false);
  const [showPublishedOnly, setShowPublishedOnly] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockComponents: Component[] = [
        {
          id: '1',
          name: 'Title Block',
          description: 'Standard title with subtitle formatting',
          type: 'text',
          category: 'typography',
          definitionId: 'def-1',
          defaultProps: {
            title: 'Title Here',
            subtitle: 'Subtitle text',
            fontSize: 24,
            color: '#333333'
          },
          supportedFormats: ['html', 'pdf', 'pptx'],
          version: 1,
          isPublished: true,
          tags: ['title', 'header', 'typography'],
          isSystem: true,
          usageCount: 156,
          createdBy: 'system',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Data Chart',
          description: 'Interactive chart component with multiple chart types',
          type: 'chart',
          category: 'visualization',
          definitionId: 'def-2',
          defaultProps: {
            type: 'bar',
            data: [],
            width: 400,
            height: 300
          },
          supportedFormats: ['html', 'pdf', 'svg', 'pptx'],
          version: 2,
          isPublished: true,
          tags: ['chart', 'data', 'visualization', 'analytics'],
          isSystem: true,
          usageCount: 89,
          createdBy: 'system',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z'
        },
        {
          id: '3',
          name: 'Contact Card',
          description: 'Business card style contact information',
          type: 'layout',
          category: 'business',
          definitionId: 'def-3',
          defaultProps: {
            name: 'John Doe',
            title: 'Manager',
            email: 'john@company.com',
            phone: '+1-555-0123'
          },
          supportedFormats: ['html', 'pdf', 'pptx'],
          version: 1,
          isPublished: true,
          tags: ['contact', 'business', 'card'],
          isSystem: false,
          usageCount: 34,
          createdBy: 'user-123',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        }
      ];
      
      setComponents(mockComponents);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredComponents = components.filter(component => {
    const matchesSearch = component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         component.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         component.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = !selectedType || component.type === selectedType;
    const matchesCategory = !selectedCategory || component.category === selectedCategory;
    const matchesSystem = !showSystemOnly || component.isSystem;
    const matchesPublished = !showPublishedOnly || component.isPublished;
    
    return matchesSearch && matchesType && matchesCategory && matchesSystem && matchesPublished;
  });

  const handleSelectComponent = useCallback((component: Component) => {
    console.log('Selected component:', component);
  }, []);

  const handleEditComponent = useCallback((component: Component) => {
    console.log('Editing component:', component);
  }, []);

  const handleDeleteComponent = useCallback((component: Component) => {
    console.log('Deleting component:', component);
  }, []);

  const handleDuplicateComponent = useCallback((component: Component) => {
    console.log('Duplicating component:', component);
  }, []);

  const handleAddToPage = useCallback((component: Component) => {
    console.log('Adding component to page:', component);
    // TODO: Integrate with canvas system
  }, []);

  const handleCreateComponent = useCallback(() => {
    console.log('Creating new component');
    // TODO: Open component creation dialog
  }, []);

  return (
    <PanelContainer>
      <PanelHeader>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#f5f8fa'
          }}>
            Components
          </h3>
          <button
            onClick={handleCreateComponent}
            style={{
              padding: '8px',
              backgroundColor: '#48aff0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}
          >
            <FaPlus size={12} />
            New Component
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: '#495563',
              border: '1px solid #5a6c7d',
              borderRadius: '4px',
              color: '#f5f8fa',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <FaSearch
            size={14}
            color="#8a9ba8"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}>
          <FilterButton
            active={showSystemOnly}
            onClick={() => setShowSystemOnly(!showSystemOnly)}
          >
            <FaCubes size={12} />
            System
          </FilterButton>
          
          <FilterButton
            active={showPublishedOnly}
            onClick={() => setShowPublishedOnly(!showPublishedOnly)}
          >
            <FaTag size={12} />
            Published
          </FilterButton>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#8a9ba8'
        }}>
          <span>
            <strong style={{ color: '#f5f8fa' }}>{filteredComponents.length}</strong> components
          </span>
          <span>
            <strong style={{ color: '#48aff0' }}>{components.filter(c => c.isSystem).length}</strong> system
          </span>
        </div>
      </PanelHeader>

      <PanelContent>
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#8a9ba8'
          }}>
            Loading components...
          </div>
        ) : filteredComponents.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: '#8a9ba8',
            textAlign: 'center',
            padding: '32px'
          }}>
            <FaCubes size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 8px 0', color: '#bfccd6' }}>
              {searchQuery ? 'No matching components' : 'No components found'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
              {searchQuery 
                ? `No components match "${searchQuery}"`
                : 'Create reusable components to build up your component library.'
              }
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0px',
            padding: '8px'
          }}>
            {filteredComponents.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onSelect={() => handleSelectComponent(component)}
                onEdit={() => handleEditComponent(component)}
                onDelete={() => handleDeleteComponent(component)}
                onDuplicate={() => handleDuplicateComponent(component)}
                onAddToPage={() => handleAddToPage(component)}
              />
            ))}
          </div>
        )}
      </PanelContent>
    </PanelContainer>
  );
});

export type { ComponentsPanelProps };