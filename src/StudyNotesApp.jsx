import React, { useState, useEffect, useRef } from 'react';
import { Plus, Star, Trash2, ChevronRight, Search, Filter, Database, AlertCircle, Copy, Mic } from 'lucide-react';
// import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';


// const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
//     const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;


export default function StudyNotesApp() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStars, setFilterStars] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [composerPriority, setComposerPriority] = useState(0);
  const composerRef = useRef(null);

  // Check if Supabase is configured
 useEffect(() => {
  // Check if Supabase client exists and has a URL
  const configured = !!supabase && !!supabase.supabaseUrl;
  setIsSupabaseConfigured(configured);

  if (configured) {
    loadSubjects();
  } else {
    // Use sample data if Supabase not configured
    const sampleData = [
      {
        id: 1,
        name: 'Computer Graphics',
        chapters: [
          { 
            id: 1, 
            name: 'CH1', 
            questions: [
              { id: 101, text: 'What is computer graphics? Explain its applications.', repeatCount: 0 },
              { id: 102, text: 'What are the main types of computer graphics?', repeatCount: 2 }
            ] 
          },
          { 
            id: 2, 
            name: 'CH2', 
            questions: [
              { id: 103, text: 'Differentiate between vector scan display and raster scan display.', repeatCount: 3 }
            ] 
          },
          { 
            id: 3, 
            name: 'CH3', 
            questions: [
              { id: 104, text: 'What do you mean by coordinate system?', repeatCount: 0 },
              { id: 105, text: 'Explain scan conversion and rasterization in detail.', repeatCount: 1 }
            ] 
          },
          { id: 4, name: 'CH4', questions: [] },
          { id: 5, name: 'CH5', questions: [] },
          { id: 6, name: 'CH6', questions: [] }
        ]
      }
    ];
    setSubjects(sampleData);
    setLoading(false);
  }
}, []);


  // Load subjects from Supabase
 const loadSubjects = async () => {
  try {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    setSubjects(data || []);
  } catch (err) {
    console.error('Error loading subjects:', err);
    setError('Failed to load data. Check console for details.');
  } finally {
    setLoading(false);
  }
};

  // Default chapters for new subjects
  const DEFAULT_CHAPTERS = [
    { id: 1, name: 'CH1', questions: [] },
    { id: 2, name: 'CH2', questions: [] },
    { id: 3, name: 'CH3', questions: [] },
    { id: 4, name: 'CH4', questions: [] },
    { id: 5, name: 'CH5', questions: [] },
    { id: 6, name: 'CH6', questions: [] }
  ];

  // Add subject to Supabase
  const addSubject = async () => {
  if (!newSubjectName.trim()) return;

  try {
    const newSubject = {
      name: newSubjectName.trim(),
      chapters: DEFAULT_CHAPTERS
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('subjects')
        .insert([newSubject])
        .select()
        .single();

      if (error) throw error;
      setSubjects([...subjects, data]);
    } else {
      const localSubject = { ...newSubject, id: Date.now() };
      setSubjects([...subjects, localSubject]);
    }

    setNewSubjectName('');
    setShowAddSubject(false);
  } catch (err) {
    console.error('Error adding subject:', err);
    setError('Failed to add subject');
  }
};

  // Delete subject from Supabase
  const deleteSubject = async (id) => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      setSubjects(subjects.filter(s => s.id !== id));
      if (selectedSubject?.id === id) {
        setSelectedSubject(null);
      }
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError('Failed to delete subject');
    }
  };

  // Update subject in Supabase
 const updateSubject = async (updatedSubject) => {
  try {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('subjects')
        .update({ chapters: updatedSubject.chapters }) // update chapters
        .eq('id', updatedSubject.id);

      if (error) throw error;
    }

    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    if (selectedSubject?.id === updatedSubject.id) {
      setSelectedSubject(updatedSubject);
    }
  } catch (err) {
    console.error('Error updating subject:', err);
    setError('Failed to update subject');
  }
};


  // Toggle star for a question in a specific chapter
  const toggleStar = (questionId, starIndex, chapterId) => {
    const updatedChapters = (selectedSubject.chapters || []).map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          questions: (chapter.questions || []).map(q =>
            q.id === questionId
              ? { ...q, repeatCount: starIndex + 1 === q.repeatCount ? starIndex : starIndex + 1 }
              : q
          )
        };
      }
      return chapter;
    });

    const updatedSubject = {
      ...selectedSubject,
      chapters: updatedChapters
    };
    updateSubject(updatedSubject);
  };

  // Legacy function - chapters are now predefined (not used in current UI)
  // const addChapter = (chapterName) => {
  //   if (!chapterName.trim() || !selectedSubject) return;
  //   const newChapter = {
  //     id: Date.now(),
  //     name: chapterName.trim(),
  //     questions: []
  //   };
  //   const updatedSubject = {
  //     ...selectedSubject,
  //     chapters: [...(selectedSubject.chapters || []), newChapter]
  //   };
  //   updateSubject(updatedSubject);
  // };// Add question to a specific chapter inside selected subject
const addQuestionToChapter = (chapterId, questionText) => {
  if (!questionText.trim() || !selectedSubject) return;

  const newQ = {
    id: Date.now(),
    text: questionText.trim(),
    repeatCount: composerPriority || 0
  };

  const updatedChapters = (selectedSubject.chapters || []).map(chapter => {
    if (chapter.id === chapterId) {
      return {
        ...chapter,
        questions: [...(chapter.questions || []), newQ]
      };
    }
    return chapter;
  });

  const updatedSubject = {
    ...selectedSubject,
    chapters: updatedChapters
  };

  updateSubject(updatedSubject);
  
  // Clear the input box and reset composer priority
  setNewQuestion('');
  setComposerPriority(0);

  // Return focus to composer textarea
  try {
    composerRef?.current?.focus?.();
  } catch {
    /* ignore focus errors */
  }

  // Activate Windows voice input (Alt+H) after 200ms delay
  setTimeout(() => {
    const event = new KeyboardEvent('keydown', {
      key: 'h',
      code: 'KeyH',
      altKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  }, 200);
};

  // Delete question from a specific chapter
  const deleteQuestion = (questionId, chapterId) => {
    const updatedChapters = (selectedSubject.chapters || []).map(chapter => {
      if (chapter.id === chapterId) {
        return {
          ...chapter,
          questions: (chapter.questions || []).filter(q => q.id !== questionId)
        };
      }
      return chapter;
    });

    const updatedSubject = {
      ...selectedSubject,
      chapters: updatedChapters
    };
    updateSubject(updatedSubject);
  };

  // Get filtered questions
 const getFilteredQuestions = (questions) => {
  return questions.filter(q => {
    if (filterStars === 'none') return q.repeatCount === 0;
    if (filterStars === 'low') return q.repeatCount >= 1 && q.repeatCount <= 3;
    if (filterStars === 'medium') return q.repeatCount >= 4 && q.repeatCount <= 7;
    if (filterStars === 'high') return q.repeatCount >= 8;
    return true; // 'all'
  }).filter(q => q.text.toLowerCase().includes(searchQuery.toLowerCase()));
};


  // Get subject stats
  const getSubjectStats = (subject) => {
    // Count questions from all chapters (support both old and new data structures)
    const allQuestions = (subject.chapters || []).flatMap(ch => ch.questions || []);
    const total = allQuestions.length;
    const notPracticed = allQuestions.filter(q => q.repeatCount === 0).length;
    const mastered = allQuestions.filter(q => q.repeatCount >= 8).length;
    return { total, notPracticed, mastered };
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }
if (!selectedSubject) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8 border border-white">
            {!isSupabaseConfigured && (
              <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <h3 className="font-semibold text-amber-900 text-xs">Demo Mode</h3>
                    <p className="text-xs text-amber-700">Data stored locally only.</p>
                  </div>
                </div>
              </div>
            )}

            {isSupabaseConfigured && (
              <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="text-emerald-600" size={16} />
                  <p className="text-xs text-emerald-700 font-medium">Connected</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-rose-50 border-l-4 border-rose-400 p-3 rounded-lg">
                <p className="text-xs text-rose-700">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">Study Dashboard</h1>
              <p className="text-sm text-slate-500">Organize and master your topics</p>
            </div>

            <div className="mb-5">
              {!showAddSubject ? (
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={16} />
                  Add Subject
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                    placeholder="Subject name..."
                    className="flex-1 px-3 py-2 text-sm border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    autoFocus
                  />
                  <button
                    onClick={addSubject}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-medium transition-all"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSubject(false);
                      setNewSubjectName('');
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjects.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <p className="text-base mb-1">No subjects yet</p>
                  <p className="text-xs">Start by adding your first subject</p>
                </div>
              ) : (
                subjects.map(subject => (
                  <div
                    key={subject.id}
                    className="group bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-base">{subject.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubject(subject.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                        {(subject.chapters || []).flatMap(ch => ch.questions || []).length} cards
                      </span>
                      {getSubjectStats(subject).notPracticed > 0 && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-medium">
                          {getSubjectStats(subject).notPracticed} new
                        </span>
                      )}
                      {getSubjectStats(subject).mastered > 0 && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-medium">
                          {getSubjectStats(subject).mastered} done
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4">
          <button
            onClick={() => setSelectedSubject(null)}
            className="text-white/90 hover:text-white mb-2 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">{selectedSubject.name}</h1>
        </div>

        {error && (
          <div className="m-4 bg-rose-50 border-l-4 border-rose-400 p-3 rounded-lg">
            <p className="text-xs text-rose-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
          {/* Left Sidebar - Chapters & Add Card */}
          <div className="lg:col-span-1 space-y-4">
            {/* Chapter Tabs */}
            <div className="bg-white rounded-xl p-3 border-2 border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Chapters</h3>
              <div className="space-y-1.5">
                {(selectedSubject.chapters || []).map(chapter => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedChapterId === chapter.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {chapter.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Card Input */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border-2 border-blue-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 mb-2">Quick Add</h3>
              <textarea
                ref={composerRef}
                rows={3}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (selectedChapterId && newQuestion.trim()) addQuestionToChapter(selectedChapterId, newQuestion);
                  }
                }}
                placeholder="Type question..."
                className="w-full resize-none px-3 py-2 text-xs rounded-lg bg-white placeholder-slate-400 text-slate-900 focus:ring-2 focus:ring-blue-400 focus:outline-none border border-slate-200 mb-2"
                disabled={!selectedChapterId}
              />

              <div className="flex items-center gap-1 mb-2 flex-wrap">
                <span className="text-xs text-slate-600 font-medium mr-1">Priority:</span>
                {[0,2,4,6,8,10].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setComposerPriority(opt)}
                    className={`w-6 h-6 text-xs rounded-md font-bold transition-all ${composerPriority === opt ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setTimeout(() => {
                      const ev = new KeyboardEvent('keydown', { key: 'h', code: 'KeyH', altKey: true, bubbles: true });
                      document.dispatchEvent(ev);
                    }, 50);
                  }}
                  type="button"
                  className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors text-xs"
                >
                  <Mic size={12} />
                  Voice
                </button>
                <button
                  onClick={() => selectedChapterId && addQuestionToChapter(selectedChapterId, newQuestion)}
                  disabled={!selectedChapterId || !newQuestion.trim()}
                  className="flex-1 px-2 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 transition-all text-xs font-medium shadow-md"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - Flashcards */}
          <div className="lg:col-span-3">
            {selectedChapterId ? (() => {
              const selectedChapter = (selectedSubject.chapters || []).find(ch => ch.id === selectedChapterId);
              const chapterQuestions = selectedChapter?.questions || [];

              return (
                <>
                  {/* Stats Bar */}
                  <div className="flex items-center gap-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-3 border border-slate-200 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600">Total:</span>
                      <span className="font-bold text-slate-900 text-sm">{chapterQuestions.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600">New:</span>
                      <span className="font-bold text-orange-600 text-sm">
                        {chapterQuestions.filter(q => q.repeatCount === 0).length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600">Mastered:</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {chapterQuestions.filter(q => q.repeatCount >= 8).length}
                      </span>
                    </div>
                  </div>

                  {/* Compact Flashcard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                    {chapterQuestions.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <p className="text-base text-slate-400 mb-1">No flashcards yet</p>
                        <p className="text-xs text-slate-400">Create your first card</p>
                      </div>
                    ) : (
                      chapterQuestions.map((question) => (
                        <div
                          key={question.id}
                          className="group bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all"
                        >
                          {/* Card Header */}
                          <div className="flex items-start justify-between mb-3">
                            <button
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(question.text || '');
                                  setCopiedId(question.id);
                                  setTimeout(() => setCopiedId(null), 1400);
                                } catch (e) {
                                  console.error('Copy failed', e);
                                }
                              }}
                              className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition-all ${
                                copiedId === question.id 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {copiedId === question.id ? '✓' : <Copy size={14} />}
                            </button>

                            <button
                              onClick={() => deleteQuestion(question.id, selectedChapterId)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Question Text - BIGGER */}
                          <p className="text-slate-900 text-base font-medium leading-relaxed mb-4 min-h-[60px]">{question.text}</p>
                          
                          {/* Rating Section */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                                {[...Array(10)].map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={() => toggleStar(question.id, index, selectedChapterId)}
                                    className="transition-transform hover:scale-125"
                                  >
                                    <Star
                                      size={14}
                                      className={
                                        index < (question.repeatCount || 0)
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-amber-200 hover:text-amber-300'
                                      }
                                    />
                                  </button>
                                ))}
                              </div>

                              <span className="text-xs font-bold text-slate-600 px-2.5 py-1.5 bg-slate-100 rounded-lg">
                                {question.repeatCount > 0 ? `${question.repeatCount}/10` : 'New'}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{
                                  width: `${Math.min(100, (question.repeatCount || 0) * 10)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
            })() : (
              <div className="text-center py-20">
                <p className="text-base text-slate-400 mb-1">Select a chapter</p>
                <p className="text-xs text-slate-400">Choose from the sidebar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

}