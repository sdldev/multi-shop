import { create } from 'zustand';

const useFlashSuccess = create((set) => ({
  show: false,
  message: 'Berhasil!',
  icon: 'check', // 'check', 'save', 'delete', 'copy', 'send'
  
  showFlash: (message, icon = 'check') => {
    set({ show: true, message, icon });
  },
  
  hideFlash: () => {
    set({ show: false });
  },
}));

export default useFlashSuccess;
