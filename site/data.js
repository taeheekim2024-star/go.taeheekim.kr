/* 교수님 연구실·시간표 자료. 사이트에서 '수정'으로 저장하면 이 파일 전체가 다시 써진다.
   'window.FACULTY = ' 뒤는 JSON 형식을 지킨다(큰따옴표, 주석·끝 쉼표 없음).
   events: day 0=일 1=월 … 6=토, start·end는 한국 시간 'HH:MM', room은 강의실. */
window.FACULTY = {
  "sourceDate": "2026-11-24",
  "semester": {"label":"2026학년도 2학기","from":"2026-09-01","to":"2026-12-14"},
  "holidays": ["2026-09-24","2026-09-25","2026-09-26","2026-10-03","2026-10-05","2026-10-09","2026-11-03"],
  "profileUrl": "https://portal.dankook.ac.kr/ctt/dku/profinfo/detailSearch?uld=",
  "periodSource": "https://www.dankook.ac.kr/documents/20118/12232463/2026%ED%95%99%EB%85%84%EB%8F%84%201%ED%95%99%EA%B8%B0%20%EC%A2%85%ED%95%A9%EA%B0%95%EC%9D%98%EC%8B%9C%EA%B0%84%ED%91%9C_%EC%97%85%EB%A1%9C%EB%93%9C%EC%9A%A9260119.pdf/0ecd0cf2-f64b-5986-a0c2-d01235678d4b?version=13.0",
  "termSource": "https://bootcamp.dankook.ac.kr/education/courseList.php?list=list&year=2026",
  "professors": [
    {"id": "kang-jason", "name": "강제이슨", "department": "생활체육학과", "building": "인문과학관", "room": "244", "uld": "FC644D0FECBADF0F24549694096A744C", "events": [
      {"title":"스포츠영어회화1","day":2,"start":"13:00","end":"15:00","room":"산학112"},
      {"title":"골프","day":3,"start":"13:00","end":"15:00","room":"인517-01"},
      {"title":"골프","day":3,"start":"15:00","end":"17:00","room":"인517-01"}
    ]},
    {"id": "kim-taeyoung", "name": "김태영", "department": "치의예과", "building": "치의학관·치과대학병원", "room": "207-03", "uld": "6FED6E1D6582CD4FBC40B494F5F55B3D", "events": [
      {"title":"치아형태학실험","day":2,"start":"15:00","end":"18:00","room":"치205-01"},
      {"title":"치과해부학실험","day":3,"start":"12:00","end":"15:00","room":"치B11"},
      {"title":"치과해부학실험","day":3,"start":"15:00","end":"18:00","room":"치B11"},
      {"title":"치아형태학실험","day":4,"start":"12:00","end":"15:00","room":"치206"},
      {"title":"치과조직학개론","day":4,"start":"15:00","end":"16:00","room":"치114"},
      {"title":"기초치의학통합실험2","day":5,"start":"09:30","end":"13:30","room":"치204"}
    ]},
    {"id": "kim-taehee", "name": "김태희", "department": "신소재공학과", "building": "자연과학1관", "room": "406-02", "uld": "3E4E330F8B409E91A70721738F754B3F", "events": [
      {"title":"신소재개론","day":1,"start":"11:00","end":"12:30","room":"공학310-01"},
      {"title":"신소재개론","day":2,"start":"11:00","end":"12:30","room":"자연1관415-01"},
      {"title":"신소재특론","day":3,"start":"09:30","end":"12:30","room":"공학107"}
    ]},
    {"id": "park-junggeon", "name": "박중건", "department": "의생명과학부", "building": "생명자원과학관", "room": "306", "uld": "F658138162CC96FD8CD95DE48918D71F", "events": [
      {"title":"생체세라믹스","day":1,"start":"09:30","end":"11:00","room":""},
      {"title":"나노약물전달과학","day":1,"start":"13:00","end":"14:30","room":""},
      {"title":"응용복합소재공학","day":2,"start":"11:00","end":"12:30","room":""},
      {"title":"나노약물전달과학","day":3,"start":"11:00","end":"12:30","room":"생명112"},
      {"title":"응용복합소재공학","day":3,"start":"14:00","end":"15:30","room":"생명104"},
      {"title":"생체세라믹스","day":4,"start":"13:00","end":"14:30","room":"생명104"}
    ]},
    {"id": "park-jiyeon", "name": "박지연", "department": "간호대학 간호학과", "building": "간호대 별관", "room": "203", "uld": "37B585143F82AB89681D21A49A68DE04", "events": [
      {"title":"간호교육방법론","day":3,"start":"09:00","end":"12:00","room":"의228"},
      {"title":"간호연구","day":4,"start":"21:40","end":"23:25","room":"의230"},
      {"title":"시뮬레이션통합실습","day":5,"start":"09:00","end":"11:00","room":""},
      {"title":"시뮬레이션통합실습","day":5,"start":"11:00","end":"13:00","room":""},
      {"title":"시뮬레이션통합실습","day":5,"start":"13:00","end":"15:00","room":""}
    ]},
    {"id": "ahn-yejin", "name": "안예진", "department": "식품영양학과", "building": "자연과학2관", "room": "411", "uld": "F171059DA1A8D68A020EDAF441C6D836", "events": [
      {"title":"식품화학1","day":2,"start":"15:30","end":"17:00","room":"자연1관308"},
      {"title":"기능성식품학","day":3,"start":"11:30","end":"13:30","room":"자연1관215"},
      {"title":"취창업·진로세미나2","day":3,"start":"15:30","end":"17:30","room":"자연1관315"},
      {"title":"식품화학1","day":4,"start":"10:30","end":"12:00","room":"자연1관407"},
      {"title":"건강기능식품학","day":4,"start":"12:00","end":"15:00","room":"자연1관408"},
      {"title":"영양생리학","day":5,"start":"09:30","end":"12:30","room":"자연1관415-01"}
    ]},
    {"id": "ahn-hyunsung", "name": "안현성", "department": "치의학과", "building": "치의학관·치과대학병원", "room": "207-05", "uld": "EA50DFFBC905B30151FA43E87FC2DA76", "events": [
      {"title":"임상치주학2","day":4,"start":"18:00","end":"18:50","room":"치114"},
      {"title":"치주학3","day":5,"start":"09:00","end":"10:00","room":"치301"}
    ]},
    {"id": "yoo-byungsun", "name": "유병선", "department": "의생명과학부", "building": "자연과학1관", "room": "526", "uld": "EB971348DAA22937D48EF81F9B7AA6D1", "events": [
      {"title":"환경미생물학","day":1,"start":"10:30","end":"12:00","room":""},
      {"title":"미생물화학2","day":2,"start":"11:00","end":"12:30","room":"자연1관514"},
      {"title":"미생물화학2","day":4,"start":"09:30","end":"11:00","room":"자연1관509"},
      {"title":"환경미생물학","day":4,"start":"14:30","end":"16:00","room":"자연1관514"}
    ]},
    {"id": "lee-sak", "name": "이삭", "department": "의예과", "building": "의학관", "room": "343호", "uld": "C87AE0D2A371BC10C6EFE16EF9AC1E06", "events": [
    ]},
    {"id": "jung-sooyong", "name": "정수용", "department": "해병대군사학과", "building": "사회과학관", "room": "108", "uld": "B71BB8895AEBA897B1B31FD72CE772E0", "events": [
      {"title":"군사심리학","day":1,"start":"09:30","end":"12:30","room":"사회302"},
      {"title":"전쟁법/군법","day":2,"start":"09:30","end":"12:30","room":"사회302"},
      {"title":"전쟁론","day":4,"start":"09:30","end":"12:30","room":"사회302"},
      {"title":"법학개론","day":4,"start":"13:30","end":"16:30","room":"사회114"}
    ]},
    {"id": "cho-yena", "name": "조예나", "department": "약학대학 약학과", "building": "약학관", "room": "522", "uld": "268BF7D5991EE49436EF5086D9625585", "events": [
      {"title":"최신약학연구Ⅲ","day":2,"start":"14:00","end":"17:00","room":"약학406"}
    ]},
    {"id": "choi-jungim", "name": "최정임", "department": "치의학과", "building": "치의학관·치과대학병원", "room": "207-04", "uld": "8C0364D1A7909B6DEEE3F64F2683CF60", "events": [
      {"title":"통합임상실습1","day":6,"start":"11:30","end":"13:00","room":""}
    ]},
    {"id": "hong-jihye", "name": "홍지혜", "department": "의예과", "building": "의학관", "room": "248", "uld": "FC374FBF9B7C48CDA04426B223AC25CC", "events": [
      {"title":"생화학2","day":1,"start":"10:00","end":"11:30","room":""},
      {"title":"생체분자의 이해","day":2,"start":"10:30","end":"12:30","room":"의학관2"},
      {"title":"생화학2","day":2,"start":"15:30","end":"17:00","room":"자연1관320"}
    ]}
  ]
};
