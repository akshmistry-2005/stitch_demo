import { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const EXERCISE_LIBRARY = [
  'Bench Press','Deadlift','Squat','Overhead Press','Barbell Row','Pull Up','Push Up','Dumbbell Curl','Tricep Extension',
  'Leg Press','Lunges','Calf Raises','Lat Pulldown','Seated Row','Face Pull','Cable Fly','Incline Press','Decline Press',
  'Front Squat','Romanian Deadlift','Hip Thrust','Leg Curl','Leg Extension','Plank','Russian Twist','Bicycle Crunch',
  'Mountain Climber','Burpee','Box Jump','Kettlebell Swing','Clean and Jerk','Snatch','Turkish Get Up','Farmer Walk',
  'Dumbbell Press','Arnold Press','Lateral Raise','Front Raise','Rear Delt Fly','Shrug','Upright Row','Preacher Curl',
  'Hammer Curl','Concentration Curl','Skull Crusher','Dip','Cable Crossover','Pec Deck','T-Bar Row','Pendlay Row',
  'Sumo Deadlift','Goblet Squat','Bulgarian Split Squat','Step Up','Glute Bridge','Cable Kickback','Donkey Kick',
  'Ab Rollout','Hanging Leg Raise','V-Up','Sit Up','Cable Crunch','Wood Chop','Side Plank','Battle Rope',
  'Sled Push','Sled Pull','Prowler Push','Jump Rope','Sprint','Rowing','Cycling','Swimming','Wall Ball',
  'Thruster','Power Clean','Muscle Up','Handstand Push Up','Pistol Squat','Dragon Flag','L-Sit','Toes to Bar',
  'Double Under','Ring Dip','Ring Row','Medicine Ball Slam','Broad Jump','Depth Jump','Plyometric Push Up',
];

export default function WorkoutsPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showExModal, setShowExModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', trainerGuidance: '' });
  const [exercises, setExercises] = useState([{ exerciseName: '', sets: '', repetitions: '' }]);
  const [exSearch, setExSearch] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [catExercises, setCatExercises] = useState({});

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try { const res = await api.getWorkoutCategories(); setCategories(res.data); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreateCategory = async () => {
    if (!catForm.name.trim()) { setErrors({ catName: 'Please enter category name' }); return; }
    setSaving(true);
    try { await api.createWorkoutCategory(catForm); setShowCatModal(false); setCatForm({ name: '', trainerGuidance: '' }); loadCategories(); }
    catch (err) { setErrors({ submit: err.message }); } finally { setSaving(false); }
  };

  const openExercises = async (cat) => {
    setSelectedCat(cat);
    setExercises([{ exerciseName: '', sets: '', repetitions: '' }]);
    setShowExModal(true);
    try { const res = await api.getExercises(cat.id); setCatExercises(prev => ({ ...prev, [cat.id]: res.data })); }
    catch {}
  };

  const addExerciseRow = () => setExercises(prev => [...prev, { exerciseName: '', sets: '', repetitions: '' }]);

  const updateExercise = (i, field, val) => {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex));
  };

  const selectFromLibrary = (name, i) => {
    updateExercise(i, 'exerciseName', name);
    setExSearch('');
  };

  const handleSaveRoutine = async () => {
    const e = {};
    exercises.forEach((ex, i) => {
      if (!ex.exerciseName.trim()) e[`name_${i}`] = 'Please enter exercise name';
      if (!ex.sets || ex.sets < 1) e[`sets_${i}`] = 'Please enter number of sets';
      if (!ex.repetitions || ex.repetitions < 1) e[`reps_${i}`] = 'Please enter number of repetitions';
    });
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      await api.addExercises(selectedCat.id, exercises.map(ex => ({ exerciseName: ex.exerciseName, sets: parseInt(ex.sets), repetitions: parseInt(ex.repetitions) })));
      setShowExModal(false);
      loadCategories();
    } catch (err) { setErrors({ submit: err.message }); } finally { setSaving(false); }
  };

  const filteredLibrary = exSearch ? EXERCISE_LIBRARY.filter(e => e.toLowerCase().includes(exSearch.toLowerCase())).slice(0, 8) : [];

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header"><h1>Workout Categories</h1><p>Build and manage workout routines</p></div>
        <button className="btn btn-primary" onClick={() => { setShowCatModal(true); setErrors({}); }}>
          <span className="material-icons-outlined">add</span> Create Workout Category
        </button>
      </div>

      {categories.length > 0 ? (
        <div className="flex gap-lg flex-wrap">
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{ flex: '1 1 300px', maxWidth: 400 }}>
              <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
                <span className="material-icons-outlined" style={{ color: 'var(--primary)', fontSize: 28 }}>fitness_center</span>
                <div><p className="title-lg">{cat.name}</p>
                {cat.trainer_guidance && <p className="body-sm text-muted">{cat.trainer_guidance}</p>}</div>
              </div>
              <p className="body-sm text-muted" style={{ marginBottom: 16 }}>
                {cat.exercise_count || 0} exercises • Created {new Date(cat.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-sm">
                <button className="btn btn-secondary btn-sm" onClick={() => openExercises(cat)}>
                  <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span> Add Exercises
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon="fitness_center" title="No Workout Categories" message="Create your first workout category to start building routines"
          action={<button className="btn btn-primary" onClick={() => setShowCatModal(true)}>Create First Category</button>} />
      )}

      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Create Workout Category"
        footer={<><button className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreateCategory} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button></>}>
        <div className="form-group"><label className="form-label">Category Name *</label>
          <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Upper Body Push" />
          {errors.catName && <p className="form-error">{errors.catName}</p>}</div>
        <div className="form-group"><label className="form-label">Trainer Guidance (optional)</label>
          <input value={catForm.trainerGuidance} onChange={e => setCatForm(p => ({ ...p, trainerGuidance: e.target.value }))} placeholder="Created with guidance of trainer..." /></div>
      </Modal>

      <Modal isOpen={showExModal} onClose={() => setShowExModal(false)} title={`Adding exercises in "${selectedCat?.name}"`} size="lg"
        footer={<>
          <button className="btn btn-secondary" onClick={addExerciseRow}><span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span> Add Exercise</button>
          <button className="btn btn-primary" onClick={handleSaveRoutine} disabled={saving}>{saving ? 'Saving...' : 'Save Routine'}</button>
        </>}>
        {errors.submit && <div className="auth-error" style={{ marginBottom: 16 }}>{errors.submit}</div>}
        <div className="search-bar" style={{ marginBottom: 20, maxWidth: '100%' }}>
          <span className="material-icons-outlined">search</span>
          <input placeholder="Search exercise library..." value={exSearch} onChange={e => setExSearch(e.target.value)} />
        </div>
        {filteredLibrary.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {filteredLibrary.map(name => (
              <button key={name} className="badge badge-primary" style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                onClick={() => selectFromLibrary(name, exercises.length - 1)}>{name}</button>
            ))}
          </div>
        )}

        {exercises.map((ex, i) => (
          <div key={i} style={{ padding: 16, background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', marginBottom: 12 }}>
            <p className="label-sm" style={{ marginBottom: 12 }}>Exercise {i + 1}</p>
            <div className="form-group"><label className="form-label">Exercise Name *</label>
              <input value={ex.exerciseName} onChange={e => updateExercise(i, 'exerciseName', e.target.value)} placeholder="e.g. Bench Press" />
              {errors[`name_${i}`] && <p className="form-error">{errors[`name_${i}`]}</p>}</div>
            <div className="flex gap-md">
              <div className="form-group flex-1"><label className="form-label">Sets *</label>
                <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} placeholder="3" min="1" />
                {errors[`sets_${i}`] && <p className="form-error">{errors[`sets_${i}`]}</p>}</div>
              <div className="form-group flex-1"><label className="form-label">Repetitions *</label>
                <input type="number" value={ex.repetitions} onChange={e => updateExercise(i, 'repetitions', e.target.value)} placeholder="10" min="1" />
                {errors[`reps_${i}`] && <p className="form-error">{errors[`reps_${i}`]}</p>}</div>
            </div>
          </div>
        ))}
      </Modal>
    </div>
  );
}
