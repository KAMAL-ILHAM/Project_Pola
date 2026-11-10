/**
 * Penanda untuk tim backend: menjelaskan logika yang belum ada.
 * Hanya tampil saat development (npm run dev); tidak muncul di build produksi.
 */
export default function BackendTodo({ children }) {
  if (!import.meta.env.DEV) return null;
  return (
    <div className="todo-note" role="note">
      <strong>TODO-BACKEND:</strong> {children}
    </div>
  );
}
