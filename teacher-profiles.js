import { mergeTeacherProfile } from './teacher-profile-utils.js';

export const teacherProfiles = {
    kim: {
        key: 'kim',
        name: '김정환 / YUMU',
        role: 'Anime Vocal Director',
        image: './instructor-kimjunghwan.png',
        summary: '애니송, 보컬 디렉션, 캐릭터 톤을 중심으로 곡의 장면감과 보컬 표현을 잡습니다.',
        specialties: ['Anime Vocal', 'Topline', 'Vocal Direction'],
        works: ['Sugar Rush Opening', 'Character Vocal Demo', 'Bright OP Arrangement'],
        note: '목소리의 캐릭터와 곡의 장면감을 함께 잡아주는 디렉팅에 강합니다.'
    },
    lee: {
        key: 'lee',
        name: 'B@kamin',
        role: 'Producer',
        image: './instructor-producer-cover.png',
        summary: 'J-POP, 애니송, 서브컬처 프로듀싱을 중심으로 곡의 완성도와 방향성을 잡습니다.',
        specialties: ['J-POP', 'Anime Song', 'Subculture'],
        works: ['Blue Hour J-POP', 'Studio Band Demo', 'Opening Song Guide'],
        note: '멜로디와 편곡의 밀도를 동시에 올리는 프로듀싱 흐름을 만듭니다.'
    },
    han: {
        key: 'han',
        name: 'Kev1',
        role: 'Game Sound Coach',
        image: './instructor-vocal-cover.png',
        summary: '게임 BGM, 사운드 디자인, 루프 구성처럼 화면에 붙는 음악과 효과음을 다룹니다.',
        specialties: ['Game Audio', 'Sound Design', 'Loop BGM'],
        works: ['Magic Skill Pack', 'Pixel UI Kit', 'Action Loop Cue'],
        note: '반복 재생과 타격감, 장면 전환을 고려한 실전형 게임 오디오를 다룹니다.'
    },
    cho: {
        key: 'cho',
        name: '은오 / Eunoh',
        role: 'Creative Director',
        image: './instructor-joeuno.png',
        summary: 'K-POP 작편곡, 사운드 디자인, 보컬 레코딩과 포트폴리오 방향을 함께 설계합니다.',
        specialties: ['K-POP', 'Sound Design', 'Vocal Recording'],
        works: ['OSUM Portfolio Guide', 'Hybrid OST Direction', 'Creator Sound Kit'],
        note: '학생의 취향을 포트폴리오의 언어로 바꾸는 큰 방향 설정에 강합니다.'
    }
};

export const getTeacherProfile = (key) => teacherProfiles[key] || {
    key,
    name: 'OSUM 강사',
    role: 'Instructor',
    image: './portfolio-default-cover.png',
    summary: 'OSUM의 수업 포트폴리오를 함께 완성하는 강사입니다.',
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
