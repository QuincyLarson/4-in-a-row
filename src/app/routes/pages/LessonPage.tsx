import { useParams } from 'react-router-dom';

import { curriculumByLesson } from '../../../content';
import { LessonPlayer } from '../../../features/lesson-player/LessonPlayer';
import { PageSection } from './shared';

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const lesson = curriculumByLesson.get(lessonId);

  if (!lesson) {
    return (
      <PageSection
        eyebrow="Lesson"
        title="Lesson not found"
        body="The requested lesson id is missing from the authored curriculum."
      />
    );
  }

  return <LessonPlayer key={lesson.id} lesson={lesson} />;
}
