const Storage = (() => {
  const KEY = "office_net_training_progress_v1";

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch {
      return {};
    }
  }

  function writeAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getCourse(courseId) {
    const all = readAll();
    return all[courseId] || { completedLessons: [] };
  }

  function setLessonCompleted(courseId, lessonId) {
    const all = readAll();
    const course = all[courseId] || { completedLessons: [] };
    if (!course.completedLessons.includes(lessonId)) course.completedLessons.push(lessonId);
    all[courseId] = course;
    writeAll(all);
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  return { readAll, getCourse, setLessonCompleted, reset };
})();
