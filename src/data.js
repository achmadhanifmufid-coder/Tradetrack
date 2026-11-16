import { createContext, useContext, useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const col = name => collection(db, 'users', auth.currentUser.uid, name);

export function useCollection(name) {
  const [state, setState] = useState({ items: null, error: null });
  useEffect(
    () =>
      onSnapshot(
        col(name),
        snap => setState({ items: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null }),
        err => setState({ items: null, error: err.message }),
      ),
    [name],
  );
  return state;
}

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export const add = (name, data) => addDoc(col(name), { ...data, createdAt: Date.now() });
export const update = (name, id, data) => updateDoc(doc(col(name), id), data);
export const remove = (name, id) => deleteDoc(doc(col(name), id));
