import { readFileSync } from "fs";
import { Parse } from './parse.js';

const exempt = new Set(['01:119:115', '01:198:111', '01:640:151', '01:355:101', '01:119:116', '01:119:117'])
function checkPrereqs(cs, prereqNotes, has) {
    if(exempt.has(cs)) return true;
    const prereqs = Parse(prereqNotes);
    if(!prereqs) return true;
    if(prereqs.constructor.name == 'CourseEqOrGr'){
        return has.some(has=>isEqOrGr(has, prereqs.courseString));
    };
    return hasPrereqs(prereqs, has);
}

function hasPrereqs(prereqs, has) {
    if(prereqs.constructor.name == 'Course'){
        const extra = [];
        if(has.includes("01:640:300")) extra.push("01:198:205");
        if(has.includes("01:640:477")) extra.push("01:198:206");
        return has.includes(prereqs.courseString) || extra.includes(prereqs.courseString);
    };
    if(prereqs.constructor.name == 'AnyOf'){
        return prereqs.reqs.some(r=>hasPrereqs(r, has));
    };
    if(prereqs.constructor.name == 'AllOf'){
        return prereqs.reqs.every(r=>hasPrereqs(r, has));
    };
    process.exit(1);
}
function isEqOrGr(cs, req) {
    if(cs.slice(0,6) != req.slice(0,6)) return false;
    return cs.slice(7) > req.slice(7);
}
function isMathElective(cs) {
    return cs.startsWith("01:640") && cs[7]>='3';
}
   
let fallCourses = JSON.parse(readFileSync("fall23.json"));
let springCourses = JSON.parse(readFileSync("spring24.json"));
let summerCourses = JSON.parse(readFileSync("summer.json"));
let courses = fallCourses.concat(springCourses).concat(summerCourses);
let courseMap = new Map();
courses.forEach(c=>courseMap.set(c.courseString, c));
let fallSet = new Set(fallCourses.map(c=>c.courseString));
let springSet = new Set(springCourses.map(c=>c.courseString));
let summerSet = new Set(summerCourses.map(c=>c.courseString));
const csElectives = new Set(["01:198:210", "01:198:213", "01:198:214", "01:198:314", "01:198:323", "01:198:324", "01:198:334", "01:198:336", "01:198:352", "01:198:411", "01:198:415", "01:198:416", "01:198:417", "01:198:419", "01:198:424", "01:198:425", "01:198:428", "01:198:431", "01:198:437", "01:198:439", "01:198:440", "01:198:442", "01:198:443", "01:198:444", "01:198:452", "01:198:460", "01:198:461", "01:198:462", "01:198:493", "01:198:494", "14:332:376", "14:332:423", "14:332:424", "14:332:443", "14:332:451", "14:332:452", "14:332:453", "14:332:456", "14:332:472", "01:640:338", "01:640:348", "01:640:354", "01:640:428", "01:640:454", "01:640:461", "01:730:315", "01:730:407", "01:730:408", "01:730:329", "01:730:424", "01:615:441", "01:960:384", "01:960:463", "01:960:476", "01:960:486"])
const contents = readFileSync(process.argv[2] ?? "courses.txt");
const lines = String(contents).split("\n").filter(l=>!l.startsWith("#")).values();
const terms = [];
const missing = []
while(true){
    const {value, done} = lines.next();
    if(done){
        break;
    }
    if(!value){
        continue
    }
    let term = [];
    while(true){
        const {value, done} = lines.next();
        if(done || !value){
            break;
        }
        const cs = value.split(" ")[0];
        const c = courseMap.get(cs);
        if(!c){
            missing.push(cs);
            continue;
        }
        term.push(cs)
    }
    terms.push({name: value, values: term})
}
const allCourses = Array.from(new Set(terms.flatMap(t=>t.values)));
for(const [i, courseString] of allCourses.entries()){
    const course = courseMap.get(courseString);
    if(!course){
        throw new Error("unknown course string: " + courseString)
    }
    const cores = course.coreCodes.map(c=>c.coreCode);
};
for(const cs of missing){
    console.log("we don't have "+cs);
};
if(missing) process.exit(1);

for(const [i,val] of terms.entries()){
    const name = val.name;
    const crs = val.values;
    const szn = name.split(" ")[0]
    const set = {
        "fall": fallSet,
        "spring": springSet,
        "summer": summerSet,
    }[szn];
    if(!set) continue;
    for(const lack in crs.filter(c=>!set.has(c))){
        console.log(`${lack} isn't offered in the ${szn}`);
    }
    const has = terms.slice(0,i).flatMap(t=>t.values);
    for(const courseString of crs){
        const course = courseMap.get(courseString);
        if(!checkPrereqs(courseString, course.preReqNotes, has)) {
            console.log(`${courseString} ${course.title.trim() ?? course.expandedTitle.trim()} missing prereqs:`);
            console.log(`   ${course.preReqNotes}`)
        }
    }
}

for(const {name,values} of terms){
    const foo = new Map();
    console.log(`${name.padStart(10, " ")} - ${values.map(c=>courseMap.get(c).credits).reduce((a,b)=>a+b) + (foo.get(name) ?? 0)} credits`)
}
console.log(allCourses.map(cs=>courseMap.get(cs).credits).reduce((a,v)=>a+v)+4+9 + "/120 credits")
console.log(allCourses.filter(cs=>csElectives.has(cs)).length + "/7 CS electives")
console.log(allCourses.filter(cs=>csElectives.has(cs) && cs.startsWith("01:198")).length + "/5 of which are in the CS department")
console.log(allCourses.filter(cs=>isMathElective(cs)).length + "/8 math electives")
