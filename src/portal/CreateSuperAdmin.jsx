import { useState } from 'react'
import { motion } from 'framer-motion'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { FiUser, FiCheck, FiX } from 'react-icons/fi'
import './CreateSuperAdmin.css'

const CreateSuperAdmin = () => {
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  const handleCreateSuperAdmin = async () => {
    setCreating(true)
    setStatus(null)
    setError(null)

    const email = 'super@gmail.com'
    const password = 'Test@123'
    const name = 'Super Admin'

    try {
      let userCredential
      let uid

      try {
        // Try to create user in Firebase Auth
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
        uid = userCredential.user.uid
        
        // IMPORTANT: Sign out immediately so Firestore write happens unauthenticated
        await signOut(auth)
        
        // Create user document in Firestore (now unauthenticated)
        await setDoc(doc(db, 'users', uid), {
          uid: uid,
          name: name,
          email: email,
          role: 'Admin',
          profilePicture: '',
          createdAt: serverTimestamp(),
          passwordChanged: false,
          isSuperAdmin: true
        })
        
        setStatus('created')
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          // User exists in Auth, find their UID from Firestore
          const usersSnapshot = await getDocs(
            query(collection(db, 'users'), where('email', '==', email))
          )
          
          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0]
            uid = userDoc.data().uid || userDoc.id
            
            // Sign out if authenticated
            if (auth.currentUser) {
              await signOut(auth)
            }
            
            // Update existing user to Admin (unauthenticated)
            await updateDoc(doc(db, 'users', userDoc.id), {
              role: 'Admin',
              isSuperAdmin: true,
              name: name
            })
            setStatus('updated')
          } else {
            // User exists in Auth but not in Firestore
            setError('User exists in Firebase Auth but not in Firestore. Please create the user document manually in Firebase Console with role: Admin')
            setCreating(false)
            return
          }
        } else {
          throw authError
        }
      }
    } catch (err) {
      console.error('Error creating super admin:', err)
      setError(err.message || 'Failed to create super admin')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="create-super-admin">
      <motion.div
        className="super-admin-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="super-admin-header">
          <FiUser />
          <h2>Create Super Admin</h2>
        </div>

        <div className="super-admin-info">
          <div className="info-item">
            <strong>Email:</strong> super@gmail.com
          </div>
          <div className="info-item">
            <strong>Password:</strong> Test@123
          </div>
          <div className="info-item">
            <strong>Role:</strong> Admin
          </div>
        </div>

        {status === 'created' && (
          <motion.div
            className="status-message success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiCheck />
            Super Admin created successfully! You can now login at /login
          </motion.div>
        )}

        {status === 'updated' && (
          <motion.div
            className="status-message success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiCheck />
            Existing user updated to Super Admin!
          </motion.div>
        )}

        {error && (
          <motion.div
            className="status-message error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiX />
            {error}
          </motion.div>
        )}

        <motion.button
          className="create-btn"
          onClick={handleCreateSuperAdmin}
          disabled={creating}
          whileHover={{ scale: creating ? 1 : 1.05 }}
          whileTap={{ scale: creating ? 1 : 0.95 }}
        >
          {creating ? 'Creating...' : 'Create Super Admin'}
        </motion.button>

        <p className="note">
          Note: This will create a user in Firebase Authentication and Firestore.
          If the user already exists, their role will be updated to Admin.
        </p>
      </motion.div>
    </div>
  )
}

export default CreateSuperAdmin