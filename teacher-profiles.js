import { mergeTeacherProfile } from './teacher-profile-utils.js';

export const teacherProfiles = {
    kim: {
        key: 'kim',
        name: '김정환',
        role: 'Anime Vocal Director',
        image: './instructor-kimjunghwan.png',
        summary: '애니메이션 보컬, 캐릭터 톤, 오프닝 사이즈의 후렴을 중심으로 학생의 곡을 완성도 있게 다듬습니다.',
        specialties: ['Anime Vocal', 'Topline', 'Vocal Direction'],
        works: ['Sugar Rush Opening', 'Character Vocal Demo', 'Bright OP Arrangement'],
        note: '목소리의 캐릭터와 곡의 장면감을 함께 잡아주는 디렉팅에 강합니다.'
    },
    lee: {
        key: 'lee',
        name: '이도윤',
        role: 'Producer',
        image: './instructor-producer-cover.png',
        summary: 'J-POP, 밴드 사운드, 서브컬처 작곡을 실제 발매 가능한 구조와 믹스 감각으로 끌고 갑니다.',
        specialties: ['J-POP', 'Band Sound', 'Arrangement'],
        works: ['Blue Hour J-POP', 'Studio Band Demo', 'Opening Song Guide'],
        note: '멜로디와 편곡의 밀도를 동시에 올리는 프로듀싱 흐름을 만듭니다.'
    },
    han: {
        key: 'han',
        name: '한수민',
        role: 'Game Sound Coach',
        image: './instructor-vocal-cover.png',
        summary: '게임 사운드 디자인, 액션 BGM, UI 효과음처럼 플레이 화면에 바로 붙는 소리를 설계합니다.',
        specialties: ['Game Audio', 'Sound Design', 'Loop BGM'],
        works: ['Magic Skill Pack', 'Pixel UI Kit', 'Action Loop Cue'],
        note: '반복 재생과 타격감, 장면 전환을 고려한 실전형 게임 오디오를 다룹니다.'
    },
    cho: {
        key: 'cho',
        name: '조윤호',
        role: 'Creative Director',
        image: './instructor-joeuno.png',
        summary: '곡의 방향, 사운드 콘셉트, 포트폴리오 완성도를 함께 설계하는 크리에이티브 디렉팅을 담당합니다.',
        specialties: ['Creative Direction', 'Portfolio', 'Subculture Sound'],
        works: ['OSUM Portfolio Guide', 'Hybrid OST Direction', 'Creator Sound Kit'],
        note: '학생의 취향을 결과물의 언어로 바꾸는 큰 방향 설정에 강합니다.'
    }
};

export const getTeacherProfile = (key) => teacherProfiles[key] || {
    key,
    name: 'OSUM 강사',
    role: 'Instructor',
    image: './portfolio-default-cover.png',
    summary: 'OSUM의 수업 결과물을 함께 완성하는 강사입니다.',
    specialties: ['Portfolio', 'Production'],
    works: ['Student Portfolio'],
    note: '상담을 통해 맞는 수업 방향을 안내합니다.'
};

export const getTeacherProfileWithOverride = (key, override) => mergeTeacherProfile(getTeacherProfile(key), override);

export const getTeacherProfileViewState = (mode = 'detail') => ({
    isWorks: mode === 'works',
    detailLabel: '강사 상세정보 보기',
    worksLabel: '강사 대표작품 보기'
});
