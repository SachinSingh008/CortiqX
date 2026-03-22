import { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setUserData(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() })
        } else {
          // ONLY create if document truly doesn't exist
          // Don't create for super@gmail.com as it should be pre-created
          if (currentUser.email !== 'super@gmail.com') {
            const newUserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.email?.split('@')[0] || 'User',
              role: 'Employee', // Default role for regular users
              profilePicture: '',
              createdAt: new Date(),
              passwordChanged: false
            }
            await setDoc(doc(db, 'users', currentUser.uid), newUserData)
            setUserData({ id: currentUser.uid, ...newUserData })
          } else {
            // Super admin should exist - something went wrong
            console.error('Super admin document not found in Firestore!')
            setUserData(null)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        setUserData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [currentUser])

  const updateUserData = async (updates) => {
    if (!currentUser) return

    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { ...updates, updatedAt: new Date() },
        { merge: true }
      )
      setUserData(prev => ({ ...prev, ...updates }))
    } catch (error) {
      console.error('Error updating user data:', error)
      throw error
    }
  }

  const value = {
    userData,
    loading,
    updateUserData,
    isAdmin: userData?.role === 'Admin',
    isEmployee: userData?.role === 'Employee',
    isBusinessAssociate: userData?.role === 'Business Associate',
    isSuperAdmin: userData?.isSuperAdmin === true
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

