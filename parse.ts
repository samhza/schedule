import { noCharOf, anyChar, string, regexp, Parjser } from "parjs";
import { between, later, many, manyTill, manySepBy, map, mapConst, or, pipe, qthen, then, thenq, backtrack, maybe } from "parjs/combinators";

export class Course {
    constructor(public courseString: string) { }
}

export class AllOf {
    constructor(public reqs: Courses[]) { }
}

export class AnyOf {
    constructor(public reqs: Courses[]) { }
}

export class CourseEqOrGr {
    constructor(public courseString: string) { }
}

export class AnyTwoCourses {
    constructor(public courses: Course[]) { }
}

export type TwoCourseWithinSubject = "two-course";

export type Courses = Course | AllOf | AnyOf;
export type Requirements = Courses | TwoCourseWithinSubject | AnyTwoCourses | CourseEqOrGr;

const pSpaces = string(" ").pipe(many())
const titleChars = "() &',-./0123456789:?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const pCourseString = regexp(/\d\d:\d\d\d:\d\d\d/)
const pCourse = pipe(
    pCourseString,
    thenq(pipe(
        anyChar(),
        manyTill(pipe(
            string(" )"),
            or(noCharOf(titleChars)),
            backtrack(),
        ))
    )),
    thenq(pSpaces),
    map(cs => new Course(cs[0]))
)

const pCourseEqOrGr = string("Any Course EQUAL or GREATER Than: ").pipe(
    qthen(pCourse.pipe(between("(", ")"))),
    map(c => new CourseEqOrGr(c.courseString))
)

const pAnyTwoCourses = string("Any Two Course from the following: ").pipe(
    qthen(pCourse.pipe(
        between("(", ")"),
        manySepBy(pSpaces),
    )),
    thenq(pSpaces),
    map(cs => new AnyTwoCourses(cs))
)

const pTwoCourseWithinSubject = string("TWO Course Within the Subject Area:").pipe(
    mapConst("two-course" as TwoCourseWithinSubject)
)

const and1 = "and";
const and2 = "<em> AND </em>"
const pSep = pipe(
    and1, or(
        and2,
        "or",
        "<em> OR </em>",
    ), thenq(pSpaces))

const pExp = later<Courses>();

pExp.init(pipe(
    pExp.pipe(between("(", ")")).pipe(
        or(pCourse)
    ),
    thenq(pSpaces),
    manySepBy(pSep),
    map(cs => {
        if (cs.length == 1) return cs[0];
        const sep = cs.separators[0];
        if (sep == and1 || sep == and2) {
            return new AllOf(cs.slice());
        } else {
            return new AnyOf(cs.slice());
        }
    }),
))

const preReqs: Parjser<Requirements> = pTwoCourseWithinSubject.pipe(or(
    pCourseEqOrGr,
    pAnyTwoCourses,
    pExp,
));


export function Parse(prereqs) {
    if(!prereqs) return null;
    return preReqs.parse(prereqs).value;
};
