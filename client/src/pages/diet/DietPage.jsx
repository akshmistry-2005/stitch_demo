import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function DietPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [planForm, setPlanForm] = useState({ name: '', meals: [{ mealName: 'Meal 1', mealTime: '', foodDetails: '' }] });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCategories(); }, []);
  const loadCategories = async () => {
    try { const res = await api.getDietCategories(); setCategories(res.data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreateCategory = async () => {
    if (!catForm.name.trim()) { setErrors({ catName: 'Category name required' }); return; }
    setSaving(true);
    try { await api.createDietCategory(catForm); setShowCatModal(false); setCatForm({ name: '', description: '' }); loadCategories(); }
    catch (err) { setErrors({ submit: err.message }); } finally { setSaving(false); }
  };

  const openPlanModal = (cat) => { setSelectedCat(cat); setShowPlanModal(true); setPlanForm({ name: '', meals: [{ mealName: 'Meal 1', mealTime: '', foodDetails: '' }] }); };

  const addMeal = () => {
    setPlanForm(prev => ({ ...prev, meals: [...prev.meals, { mealName: `Meal ${prev.meals.length + 1}`, mealTime: '', foodDetails: '' }] }));
  };

  const updateMeal = (i, field, val) => {
    setPlanForm(prev => ({ ...prev, meals: prev.meals.map((m, idx) => idx === i ? { ...m, [field]: val } : m) }));
  };

  const removeMeal = (i) => {
    if (planForm.meals.length <= 1) return;
    setPlanForm(prev => ({ ...prev, meals: prev.meals.filter((_, idx) => idx !== i) }));
  };

  const handleSavePlan = async () => {
    if (!planForm.name.trim()) { setErrors({ planName: 'Plan name required' }); return; }
    setSaving(true);
    try { await api.createDietPlan({ categoryId: selectedCat.id, name: planForm.name, meals: planForm.meals }); setShowPlanModal(false); loadCategories(); }
    catch (err) { setErrors({ submit: err.message }); } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header"><h1>Diet Categories</h1><p>Create and manage diet plans with meals</p></div>
        <button className="btn btn-primary" onClick={() => { setShowCatModal(true); setErrors({}); }}>
          <span className="material-icons-outlined">add</span> Add Diet Category
        </button>
      </div>

      {categories.length > 0 ? (
        <div className="flex gap-lg flex-wrap">
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{ flex: '1 1 300px', maxWidth: 400 }}>
              <span className="material-icons-outlined" style={{ color: 'var(--secondary)', fontSize: 32, marginBottom: 12 }}>restaurant_menu</span>
              <p className="title-lg" style={{ marginBottom: 4 }}>{cat.name}</p>
              {cat.description && <p className="body-sm text-muted" style={{ marginBottom: 8 }}>{cat.description}</p>}
              <p className="body-sm text-muted" style={{ marginBottom: 16 }}>{cat.plan_count || 0} plans</p>
              <button className="btn btn-secondary btn-sm" onClick={() => openPlanModal(cat)}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span> Add Diet Plan
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="restaurant_menu" title="No Diet Categories" message="Create a diet category to start building nutrition plans"
          action={<button className="btn btn-primary" onClick={() => setShowCatModal(true)}>Create First Category</button>} />
      )}

      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Add Diet Category"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreateCategory} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button></>}>
        <div className="form-group"><label className="form-label">Category Name *</label>
          <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Weight Loss, Muscle Gain" />
          {errors.catName && <p className="form-error">{errors.catName}</p>}</div>
        <div className="form-group"><label className="form-label">Description</label>
          <textarea rows={3} value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." /></div>
      </Modal>

      <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title={`Add Diet Plan — ${selectedCat?.name}`} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSavePlan} disabled={saving}>{saving ? 'Saving...' : 'Save Diet Plan'}</button></>}>
        {errors.submit && <div className="auth-error" style={{ marginBottom: 16 }}>{errors.submit}</div>}
        <div className="form-group"><label className="form-label">Plan Name *</label>
          <input value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Beginner Cut Plan" />
          {errors.planName && <p className="form-error">{errors.planName}</p>}</div>

        {planForm.meals.map((meal, i) => (
          <div key={i} style={{ padding: 16, background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', marginBottom: 12, position: 'relative' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
              <input value={meal.mealName} onChange={e => updateMeal(i, 'mealName', e.target.value)}
                style={{ background: 'transparent', fontWeight: 600, fontSize: '0.9375rem', padding: '4px 0', border: 'none', borderBottom: '2px dashed var(--outline-variant)', borderRadius: 0, width: 'auto' }} />
              {planForm.meals.length > 1 && <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => removeMeal(i)}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>close</span></button>}
            </div>
            <div className="form-group"><label className="form-label">Meal Time</label>
              <input type="time" value={meal.mealTime} onChange={e => updateMeal(i, 'mealTime', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Food / Dish Details</label>
              <textarea rows={2} value={meal.foodDetails} onChange={e => updateMeal(i, 'foodDetails', e.target.value)}
                placeholder="e.g. 4 egg whites, oatmeal, banana..." /></div>
          </div>
        ))}

        <button className="btn btn-tertiary w-full" onClick={addMeal} style={{ marginTop: 8, border: '2px dashed var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
          <span className="material-icons-outlined">add</span> Add Meal
        </button>
      </Modal>
    </div>
  );
}
