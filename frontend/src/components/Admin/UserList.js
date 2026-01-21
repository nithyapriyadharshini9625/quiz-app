import React, { useState, useEffect } from 'react';
import './UserList.css';

const UserList = ({ users, onEdit, onDelete, onView, userRole }) => {
  // Check if user can delete (only admin and superadmin)
  const canDelete = userRole === 'admin' || userRole === 'superadmin';
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // Reset to page 1 when users list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  if (users.length === 0) {
    return (
      <div className="empty-state">
        <p>No users found.</p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(users.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'admin': 'Admin',
      'superadmin': 'Super Admin',
      'user': 'User',
      'manager': 'Manager'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const classMap = {
      'admin': 'role-badge-admin',
      'superadmin': 'role-badge-superadmin',
      'user': 'role-badge-user',
      'manager': 'role-badge-manager'
    };
    return classMap[role] || '';
  };

  // Generate page numbers to display (show max 5 pages at a time)
  const getPageNumbers = () => {
    const maxVisible = 5;
    const pages = [];
    
    if (totalPages <= maxVisible) {
      // Show all pages if total pages is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show 5 pages with smart positioning
      let startPage, endPage;
      
      if (currentPage <= 3) {
        // Near the start: show pages 1-5
        startPage = 1;
        endPage = maxVisible;
      } else if (currentPage >= totalPages - 2) {
        // Near the end: show last 5 pages
        startPage = totalPages - maxVisible + 1;
        endPage = totalPages;
      } else {
        // In the middle: show current page with 2 on each side
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="user-list">
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <div className="user-info">
                    <span className="user-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                    <span className="user-name">{user.username}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => onView(user)}
                      className="view-user-btn"
                      title="View User Details"
                      onMouseEnter={(e) => {
                        const icon = e.currentTarget.querySelector('i');
                        if (icon) icon.style.color = '#2e7d32';
                      }}
                      onMouseLeave={(e) => {
                        const icon = e.currentTarget.querySelector('i');
                        if (icon) icon.style.color = '#4caf50';
                      }}
                    >
                      <i className="fas fa-eye" style={{ color: '#4caf50' }}></i>
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="edit-user-btn"
                      title="Edit User"
                      onMouseEnter={(e) => {
                        const icon = e.currentTarget.querySelector('i');
                        if (icon) icon.style.color = '#1565c0';
                      }}
                      onMouseLeave={(e) => {
                        const icon = e.currentTarget.querySelector('i');
                        if (icon) icon.style.color = '#2196f3';
                      }}
                    >
                      <i className="fas fa-edit" style={{ color: '#2196f3' }}></i>
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => onDelete(user._id)}
                        className="delete-user-btn"
                        title="Delete User"
                        onMouseEnter={(e) => {
                          const icon = e.currentTarget.querySelector('i');
                          if (icon) icon.style.color = '#c62828';
                        }}
                        onMouseLeave={(e) => {
                          const icon = e.currentTarget.querySelector('i');
                          if (icon) icon.style.color = '#f44336';
                        }}
                      >
                        <i className="fas fa-trash" style={{ color: '#f44336' }}></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-nav-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            <div className="pagination-indicators">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`pagination-indicator ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="pagination-nav-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;

