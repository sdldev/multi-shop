# FlashSuccess - Quick Start

## Penggunaan Cepat

### 1. Import hook
```jsx
import { useFlashSuccess } from '../components/FlashSuccessProvider';
```

### 2. Destructure showFlash
```jsx
const { showFlash } = useFlashSuccess();
```

### 3. Panggil showFlash
```jsx
// Simple
showFlash('Berhasil!');

// With icon
showFlash('Data disimpan!', { icon: 'save' });

// With callback
showFlash('Customer ditambahkan!', {
  icon: 'check',
  onComplete: () => navigate('/success')
});
```

## Icon Options
- `check` - General success ✓
- `save` - Save data 💾
- `delete` - Delete item 🗑️
- `copy` - Copy to clipboard 📋
- `send` - Send/Submit ✉️

## Contoh Lengkap

### Login Success
```jsx
import { useFlashSuccess } from '../components/FlashSuccessProvider';

function Login() {
  const { showFlash } = useFlashSuccess();
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      dispatch(setCredentials(response.data));
      
      // Show flash then navigate
      showFlash(`Selamat datang, ${response.data.user.full_name}!`, {
        icon: 'check',
        onComplete: () => navigate('/')
      });
    } catch (error) {
      addToast({ title: 'Error', variant: 'destructive' });
    }
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

### Create Customer
```jsx
import { useFlashSuccess } from '../components/FlashSuccessProvider';

function CustomerForm() {
  const { showFlash } = useFlashSuccess();

  const handleSubmit = async (data) => {
    try {
      await api.create(data);
      showFlash('Customer berhasil ditambahkan!', {
        icon: 'check',
        onComplete: () => setView('success')
      });
    } catch (error) {
      // Gunakan toast untuk error
      addToast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showFlash('Disalin!', { icon: 'copy' });
  };

  return (
    <>
      <button onClick={handleSubmit}>Tambah</button>
      <button onClick={() => handleCopy('0812345')}>Copy</button>
    </>
  );
}
```

## Kapan Menggunakan?

✅ **Gunakan FlashSuccess untuk:**
- Success actions (create, update, delete berhasil)
- Copy to clipboard
- Save/submit berhasil
- Send email berhasil
- Quick feedback yang tidak memerlukan user action

❌ **Jangan gunakan untuk:**
- Error messages (gunakan toast destructive)
- Loading states (gunakan loading indicator)
- Messages yang perlu dibaca lama (gunakan toast)
- Confirmations (gunakan dialog)

Lihat [dokumentasi lengkap](./FlashSuccess.md) untuk detail lebih lanjut.
