import { noCharOf, anyChar, string, regexp } from "parjs";
import { between, later, many, manyTill, manySepBy, map, mapConst, or, pipe, qthen, thenq, backtrack } from "parjs/combinators";
export class Course {
    courseString;
    constructor(courseString) {
        this.courseString = courseString;
    }
}
export class AllOf {
    reqs;
    constructor(reqs) {
        this.reqs = reqs;
    }
}
export class AnyOf {
    reqs;
    constructor(reqs) {
        this.reqs = reqs;
    }
}
export class CourseEqOrGr {
    courseString;
    constructor(courseString) {
        this.courseString = courseString;
    }
}
export class AnyTwoCourses {
    courses;
    constructor(courses) {
        this.courses = courses;
    }
}
const pSpaces = string(" ").pipe(many());
const titleChars = "() &',-./0123456789:?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const pCourseString = regexp(/\d\d:\d\d\d:\d\d\d/);
const pCourse = pipe(pCourseString, thenq(pipe(anyChar(), manyTill(pipe(string(" )"), or(noCharOf(titleChars)), backtrack())))), thenq(pSpaces), map(cs => new Course(cs[0])));
const pCourseEqOrGr = string("Any Course EQUAL or GREATER Than: ").pipe(qthen(pCourse.pipe(between("(", ")"))), map(c => new CourseEqOrGr(c.courseString)));
const pAnyTwoCourses = string("Any Two Course from the following: ").pipe(qthen(pCourse.pipe(between("(", ")"), manySepBy(pSpaces))), thenq(pSpaces), map(cs => new AnyTwoCourses(cs)));
const pTwoCourseWithinSubject = string("TWO Course Within the Subject Area:").pipe(mapConst("two-course"));
const and1 = "and";
const and2 = "<em> AND </em>";
const pSep = pipe(and1, or(and2, "or", "<em> OR </em>"), thenq(pSpaces));
const pExp = later();
pExp.init(pipe(pExp.pipe(between("(", ")")).pipe(or(pCourse)), thenq(pSpaces), manySepBy(pSep), map(cs => {
    if (cs.length == 1)
        return cs[0];
    const sep = cs.separators[0];
    if (sep == and1 || sep == and2) {
        return new AllOf(cs.slice());
    }
    else {
        return new AnyOf(cs.slice());
    }
})));
const preReqs = pTwoCourseWithinSubject.pipe(or(pCourseEqOrGr, pAnyTwoCourses, pExp));
export function Parse(prereqs) {
    if (!prereqs)
        return null;
    return preReqs.parse(prereqs).value;
}
;
