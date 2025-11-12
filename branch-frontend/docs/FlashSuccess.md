# FlashSuccess Component

Komponen global untuk menampilkan notifikasi sukses dengan animasi flash yang elegan dan non-intrusive.

## Features

✅ **Global State Management** - Satu instance untuk seluruh aplikasi
✅ **Multiple Icons** - Support berbagai jenis aksi (check, save, delete, copy, send)
✅ **Auto-hide** - Otomatis hilang setelah 1.5 detik
✅ **Callback Support** - Execute action setelah flash selesai
✅ **Smooth Animations** - Backdrop blur, zoom-in, ping effect
✅ **Mobile Optimized** - Responsive dan touch-friendly

## Setup

### 1. Wrap App dengan FlashSuccessProvider

```jsx
// App.jsx
import { FlashSuccessProvider } from './components/FlashSuccessProvider';

function App() {
  return (
    <Provider store={store}>
      <FlashSuccessProvider>
        {/* Your app routes */}
      </FlashSuccessProvider>
    </Provider>
  );
}
```

### 2. Use dalam Component

```jsx
import { useFlashSuccess } from '../components/FlashSuccessProvider';

function MyComponent() {
  const { showFlash } = useFlashSuccess();

  const handleSave = async () => {
    // Your save logic...
    showFlash('Data berhasil disimpan!', { icon: 'save' });
  };

  return (
    <button onClick={handleSave}>Save</button>
  );
}
```

## API Reference

### useFlashSuccess Hook

```typescript
const { showFlash, hideFlash } = useFlashSuccess();
```

#### showFlash(message, options?)

Menampilkan flash success dengan pesan dan opsi.

**Parameters:**
- `message` (string) - Pesan yang ditampilkan
- `options` (object, optional)
  - `icon` (string) - Icon type: 'check' | 'save' | 'delete' | 'copy' | 'send' (default: 'check')
  - `onComplete` (function) - Callback yang dipanggil setelah flash hilang

**Examples:**

```jsx
// Simple success message
showFlash('Berhasil!');

// With custom icon
showFlash('Data berhasil disimpan!', { icon: 'save' });

// With callback
showFlash('Customer berhasil ditambahkan!', {
  icon: 'check',
  onComplete: () => {
    setView('success');
    fetchCustomers();
  }
});
```

#### hideFlash()

Menyembunyikan flash secara manual (jarang dibutuhkan karena auto-hide).

```jsx
hideFlash();
```

## Icon Types

| Icon | Use Case | Lucide Component |
|------|----------|------------------|
| `check` | General success, create, update | `Check` |
| `save` | Save, persist data | `Save` |
| `delete` | Delete, remove | `Trash2` |
| `copy` | Copy to clipboard | `Copy` |
| `send` | Send, submit, email | `Send` |

## Usage Examples

### Login Success

```jsx
const handleLogin = async (credentials) => {
  try {
    const response = await authAPI.login(credentials);
    dispatch(setCredentials(response.data));
    
    // Show flash then navigate to dashboard
    showFlash(`Selamat datang, ${response.data.user.full_name}!`, {
      icon: 'check',
      onComplete: () => navigate('/')
    });
  } catch (error) {
    // Handle error with toast
    addToast({ title: 'Login gagal', variant: 'destructive' });
  }
};
```

### Create Customer

```jsx
const handleAddCustomer = async (data) => {
  try {
    await customersAPI.create(data);
    showFlash('Customer berhasil ditambahkan!', {
      icon: 'check',
      onComplete: () => setView('success')
    });
  } catch (error) {
    // Handle error with toast
    addToast({ title: 'Error', variant: 'destructive' });
  }
};
```

### Copy to Clipboard

```jsx
const handleCopy = (text) => {
  navigator.clipboard.writeText(text);
  showFlash('Nomor telepon disalin!', { icon: 'copy' });
};
```

### Save Settings

```jsx
const handleSaveSettings = async () => {
  await updateSettings(settings);
  showFlash('Pengaturan berhasil disimpan!', { icon: 'save' });
};
```

### Delete Item

```jsx
const handleDelete = async (id) => {
  await deleteItem(id);
  showFlash('Item berhasil dihapus!', { 
    icon: 'delete',
    onComplete: () => fetchItems()
  });
};
```

### Send Email

```jsx
const handleSendEmail = async () => {
  await sendEmail(emailData);
  showFlash('Email berhasil dikirim!', { icon: 'send' });
};
```

## Best Practices

### ✅ DO

- Use untuk success actions (create, update, save, copy, send)
- Gunakan icon yang sesuai dengan action
- Berikan pesan yang jelas dan singkat
- Gunakan callback untuk action lanjutan (redirect, refresh, dll)

```jsx
// GOOD
showFlash('Customer berhasil ditambahkan!', {
  icon: 'check',
  onComplete: () => navigate('/customers')
});
```

### ❌ DON'T

- Jangan gunakan untuk error messages (gunakan toast dengan variant destructive)
- Jangan gunakan untuk loading states
- Jangan chain multiple flash (tunggu yang pertama selesai)
- Jangan gunakan pesan yang terlalu panjang

```jsx
// BAD - Use toast for errors
showFlash('Gagal menambahkan customer!'); // ❌

// BAD - Message too long
showFlash('Customer dengan nama John Doe dan email john@example.com berhasil ditambahkan ke database!'); // ❌

// GOOD - Keep it short
showFlash('Customer berhasil ditambahkan!'); // ✅
```

## Migration from Toast

### Before (Toast)

```jsx
addToast({ 
  title: 'Berhasil', 
  description: 'Customer berhasil ditambahkan',
  variant: 'default' 
});
```

### After (FlashSuccess)

```jsx
showFlash('Customer berhasil ditambahkan!', { icon: 'check' });
```

## Customization

### Timing

Default auto-hide: 1.5 seconds. Untuk mengubah, edit di `FlashSuccess.jsx`:

```jsx
const timer = setTimeout(() => {
  onComplete();
}, 1500); // Change this value
```

### Styling

Component menggunakan Tailwind classes. Untuk customize:

```jsx
// FlashSuccess.jsx
<div className="bg-white rounded-2xl shadow-2xl p-8">
  {/* Ganti class sesuai kebutuhan */}
</div>
```

### Adding New Icons

1. Import icon dari Lucide React:
```jsx
import { Check, Save, Trash2, Copy, Send, YourNewIcon } from 'lucide-react';
```

2. Tambahkan ke iconComponents:
```jsx
const iconComponents = {
  check: Check,
  save: Save,
  delete: Trash2,
  copy: Copy,
  send: Send,
  yourkey: YourNewIcon, // Add here
};
```

3. Gunakan:
```jsx
showFlash('Success!', { icon: 'yourkey' });
```

## Troubleshooting

### Flash tidak muncul

✅ Check: FlashSuccessProvider sudah wrap App?
✅ Check: Import useFlashSuccess dari path yang benar?

### Flash muncul tapi tidak auto-hide

✅ Check: onComplete prop sudah diteruskan ke FlashSuccess?
✅ Check: Console untuk error di useEffect?

### Icon tidak muncul

✅ Check: Icon type sudah terdaftar di iconComponents?
✅ Check: Lucide React sudah terinstall?

## Performance

- **Render Optimization**: Component hanya render saat `show=true`
- **Memory**: Auto cleanup dengan useEffect return
- **Z-index**: z-100 untuk ensure always on top
- **Bundle Size**: ~2KB (with Lucide icons tree-shaking)
