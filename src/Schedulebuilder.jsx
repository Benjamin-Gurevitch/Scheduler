import React, { useState } from 'react';
import courseData from './courseData.json?inline'
import { X, Calendar, Menu, Search, ChevronLeft, ChevronRight } from 'lucide-react';
const colorPalette = [
    'bg-blue-500/70',
    'bg-green-500/70',
    'bg-purple-500/70',
    'bg-orange-500/70',
    'bg-pink-500/70',
    'bg-teal-500/70',
    'bg-indigo-500/70',
    'bg-red-500/70',
    'bg-amber-500/70',
    'bg-cyan-500/70',
    'bg-emerald-500/70',
    'bg-violet-500/70',
  ];
const timeToSlotIndex = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    // Each hour now has 2 slots (8:15-8:45, 8:45-9:15, etc.)
    return (hours - 8) * 2 + (minutes === 45 ? 1 : 0);
  };

  const isTimeInRange = (timeSlot, classTime) => {
    // Split the time slot into start and end times
    const [slotStart] = timeSlot.split('-');
    const [classStart, classEnd] = classTime.split(' - ');
    
    // Convert current time to index
    const timeIndex = timeToSlotIndex(slotStart);
    const startIndex = timeToSlotIndex(classStart);
    const endIndex = timeToSlotIndex(classEnd); // Subtract 1 to not include the end time slot
    
    return timeIndex >= startIndex && timeIndex < endIndex;  // Changed <= to < for endIndex
  };
  const countFreeDays = (schedule) => {
    const daySchedules = {};
    
    // Initialize all days as free
    const daysOfWeek = ['M', 'T', 'W', 'R', 'F'];
    daysOfWeek.forEach(day => {
      daySchedules[day] = false;
    });
  
    // Mark days that have classes
    schedule.forEach(course => {
      course.schedule.forEach(slot => {
        slot.days.forEach(day => {
          daySchedules[day] = true;
        });
      });
    });
  
    // Count days without any classes
    return daysOfWeek.filter(day => !daySchedules[day]).length;
  };
  
  const hasEarlyStart = (schedule) => {
    return schedule.some(course => 
      course.schedule.some(slot => {
        const startTime = timeToSlotIndex(slot.time.split(' - ')[0]);
        return startTime < timeToSlotIndex('10:15');
      })
    );
  };
  
  const hasLateEnd = (schedule) => {
    return schedule.some(course => 
      course.schedule.some(slot => {
        const endTime = timeToSlotIndex(slot.time.split(' - ')[1]);
        return endTime > timeToSlotIndex('16:15');
      })
    );
  };
const calculateGapSize = (schedule) => {
  // Group slots by day
  const daySchedules = {};
  schedule.forEach(course => {
    course.schedule.forEach(slot => {
      slot.days.forEach(day => {
        if (!daySchedules[day]) daySchedules[day] = [];
        daySchedules[day].push({
          start: timeToSlotIndex(slot.time.split(' - ')[0]),
          end: timeToSlotIndex(slot.time.split(' - ')[1])
        });
      });
    });
  });

  // Calculate gaps for each day
  let totalGap = 0;
  Object.values(daySchedules).forEach(slots => {
    if (slots.length <= 1) return;
    
    // Sort slots by start time
    slots.sort((a, b) => a.start - b.start);
    
    // Calculate gaps between consecutive slots
    for (let i = 1; i < slots.length; i++) {
      const gap = slots[i].start - slots[i-1].end;
      if (gap > 0) totalGap += gap;
    }
  });

  return totalGap;
};

const courseCategories = [
    "English",
    "Science",
    "Physical Education",
    "French",
    "Arts & Sciences",
    "Arts, Literature and Communication",
    "Liberal Arts",
    "Music",
    "Social Science",
    "Humanities",
    "Complementary",
  ];
  
  // Define groups for categories that have them
  const groupedCategories = {
    "Arts & Sciences": ["2024", "Pre-2024"],
    "Science": ["2024", "Pre-2024"],
    "English": ["101", "102", "103", "LPE"],
    "Humanities": ["101", "102", "LPH"],
    "French": ["100", "101", "102", "103", "Epreuve"],
    "Physical Education": ["101", "102", "103"]
  };
  function identifyCourse(courseCode, section) {
    // Base course mapping
    const baseCodeMap = {
      '101-SN1-RE': 'Cellular Biology',
      '101-SN2-RE': 'Ecology and Evolution',
      '201-SN1-RE': 'Probability and Statistics',
      '201-SN2-RE': 'Differential Calculus',
      '201-SN3-RE': 'Integral Calculus',
      '202-SN1-RE': 'General Chemistry',
      '202-SN2-RE': 'Chemistry of Solutions',
      '203-SN1-RE': 'Mechanics',
      '420-SN1-RE': 'Programming in Science',
      // Pre-2024 courses
      '201-NYC-05': 'Linear Algebra',
      '203-NYB-05': 'Electricity and Magnetism',
      '203-NYC-05': 'Waves, Light and Modern Physics',
      '201-NYB-05': 'Integral Calculus',
      '101-LCU-05': 'General Biology II',
      '101-LCV-05': 'Human Physiology',
      '201-LCU-05': 'Calculus III',
      '201-LCV-05': 'Linear Algebra II',
      '201-LCW-05': 'Probability and Statistics',
      '201-LCY-05': 'Finite Mathematics',
      '202-LCU-05': 'Organic Chemistry I',
      '203-LCW-05': 'Astrophysics',
      '420-LCU-05': 'Computer Programming',
      '420-LCV-05': 'Technical Drawing',
      '420-LCW-MS': 'Programming Techniques and Applications'
    };
  
    // Get base course name
    const baseName = baseCodeMap[courseCode];
    if (!baseName) return null;
  
    // Handle special sections
    const sectionNum = parseInt(section);
    
    // French sections (500-599)
    if (sectionNum >= 500 && sectionNum < 600) {
      const frenchNames = {
        '201-SN2-RE': 'Calcul différentiel',
        '201-SN3-RE': 'Calcul intégral',
        '203-SN1-RE': 'Mécanique'
      };
      return frenchNames[courseCode] || `${baseName} (French)`;
    }
  
    // Enriched sections (typically 021, 022)
    if (section === '021' || section === '022') {
      // Special enriched names
      if (courseCode === '203-NYB-05' && section === '021') {
        return 'ENRICHED - MODERN PHYSICS - Electricity and Magnetism';
      }
      if (courseCode === '203-NYB-05' && section === '022') {
        return 'ENRICHED - LIFE SCIENCES - Electricity and Magnetism';
      }
      if (courseCode === '203-SN1-RE' && section === '021') {
        return 'ENRICHED - LIFE SCIENCES - Mechanics';
      }
      // General enriched
      return `ENRICHED - ${baseName}`;
    }
  
    // A&S sections (071, 072)
    if (section.startsWith('07')) {
      return `A&S - ${baseName}`;
    }
  
    // Default case - return base name
    return baseName;
  }
  const { sampleClasses } = courseData;



const FilterDropdown = ({ label, options, value, onChange, grouped = false }) => {
    if (!grouped) {
      return (
        <div className="relative">
          <select 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-700 text-gray-200 py-1.5 px-3 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-500 text-sm"
          >
            <option value="">{label}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }
  
    return (
      <div className="relative">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-700 text-gray-200 py-1.5 px-3 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-500 text-sm"
        >
          <option value="">{label}</option>
          {Object.entries(options).map(([category, groups]) => (
            <optgroup key={category} label={category}>
              {groups.map(group => (
                <option key={`${category}-${group}`} value={`${category}-${group}`}>
                  {group}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    );
  };
  const ScheduleBuilder = () => {
    const [selectedClasses, setSelectedClasses] = useState([]); 
    const [hoveredClass, setHoveredClass] = useState(null);   
    const [searchTerm, setSearchTerm] = useState("");         
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");     
    const [hoveredCell, setHoveredCell] = useState(null);
    const [minFreeDays, setMinFreeDays] = useState(0);
    const [noEarlyStarts, setNoEarlyStarts] = useState(false);
    const [noLateEnds, setNoLateEnds] = useState(false);
    const [selectedCourses, setSelectedCourses] = useState(Array(7).fill({ 
      category: '', 
      group: '', 
      specificCourse: '' 
    }));
    const [minimizeGaps, setMinimizeGaps] = useState(false);
    const [generatedSchedules, setGeneratedSchedules] = useState([]);
    const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
    const [courseColors, setCourseColors] = useState({}); // Add this state variable
    const [showingGeneratedSchedules, setShowingGeneratedSchedules] = useState(false);
    function generateScheduleCombinations(selectedCourses, sampleClasses, minimizeGaps) {
      // Filter out empty course selections (must have at least category)
      const validCourses = selectedCourses.filter(course => course.category);
      console.log("Valid courses:", validCourses);
      
      // Get all sections for each selected course
      const courseSections = validCourses.map(course => {
        const { category, group, specificCourse } = course;
        
        // For science courses, we need specific course handling
        if (category === 'Science' && specificCourse) {
          const parts = specificCourse.split('-');
          const sectionNum = parts.pop(); // Get section number
          const courseCode = parts.join('-'); // Get course code
          
          console.log("Looking for science course:", { courseCode, sectionNum });
          
          // Find all sections for this course code
          let sections = sampleClasses.filter(c => c.code === courseCode);
          
          // If a specific section type is requested, filter for it
          if (sectionNum) {
            const sectionNumber = parseInt(sectionNum);
            // Filter based on section number rules
            if (sectionNumber >= 500 && sectionNumber < 600) {
              sections = sections.filter(s => parseInt(s.section) >= 500 && parseInt(s.section) < 600);
            } else if (sectionNumber >= 70 && sectionNumber < 80) {
              sections = sections.filter(s => parseInt(s.section) >= 70 && parseInt(s.section) < 80);
            } else if (sectionNumber === 21 || sectionNumber === 22) {
              sections = sections.filter(s => s.section === '021' || s.section === '022');
            } else {
              sections = sections.filter(s => {
                const sec = parseInt(s.section);
                return sec > 0 && sec <= 20;
              });
            }
          }
          
          console.log(`Found ${sections.length} sections for science course ${courseCode}`);
          return sections;
        } 
        // For non-science courses, we just need category and group
        else if (category && group) {
          console.log("Processing non-science course:", { category, group });
          
          // Get all sections that match the category and group
          let sections = sampleClasses.filter(c => 
            c.category === category && 
            c.group === group
          );
    
          console.log(`Found ${sections.length} sections for ${category} ${group}`);
          return sections;
        }
        return [];
      }).filter(sections => sections.length > 0);
      
      console.log("Course sections to combine:", courseSections);
    
      // Generate all possible combinations
      function cartesianProduct(arrays) {
        return arrays.reduce((a, b) => 
          a.flatMap(x => b.map(y => [...x, y])), [[]]);
      }
    
      const allCombinations = cartesianProduct(courseSections);
      console.log(`Generated ${allCombinations.length} possible combinations`);
    
      // Check for schedule conflicts
      function hasConflict(schedule1, schedule2) {
        return schedule1.some(slot1 =>
          schedule2.some(slot2 => {
            // Check if any days overlap
            const sharedDays = slot1.days.filter(day => slot2.days.includes(day));
            if (sharedDays.length === 0) return false;
    
            // Check time overlap
            const [start1, end1] = slot1.time.split(' - ');
            const [start2, end2] = slot2.time.split(' - ');
            const startIndex1 = timeToSlotIndex(start1);
            const endIndex1 = timeToSlotIndex(end1);
            const startIndex2 = timeToSlotIndex(start2);
            const endIndex2 = timeToSlotIndex(end2);
    
            return startIndex1 < endIndex2 && endIndex1 > startIndex2;
          })
        );
      }
    
      // Filter out combinations with conflicts
        const validCombinations = allCombinations.filter(combination => {
          if (combination.length === 0) return false;
          
          // Check for conflicts
          for (let i = 0; i < combination.length; i++) {
            for (let j = i + 1; j < combination.length; j++) {
              if (hasConflict(combination[i].schedule, combination[j].schedule)) {
                return false;
              }
            }
          }

          // Check preferences
          if (noEarlyStarts && hasEarlyStart(combination)) return false;
          if (noLateEnds && hasLateEnd(combination)) return false;

          // Calculate free days for the entire combination
          const freeDaysCount = countFreeDays(combination);
          if (freeDaysCount < minFreeDays) return false;

          return true;
        });

        console.log(`Found ${validCombinations.length} valid combinations`);

        // If no valid combinations found, alert the user instead of returning an empty schedule
        if (validCombinations.length === 0) {
          alert("No valid schedules found with current preferences. Try adjusting your preferences (especially the minimum free days requirement).");
          return [];
        }
    
      console.log(`Found ${validCombinations.length} valid combinations`);
    
      if (validCombinations.length === 0 && courseSections.length > 0) {
        return courseSections.map(sections => [sections[0]]);
      }
    
      const sortedCombinations = validCombinations.map(schedule => ({
        schedule,
        gapSize: calculateGapSize(schedule)
      }));
      
      if (minimizeGaps) {
        sortedCombinations.sort((a, b) => a.gapSize - b.gapSize);
        return sortedCombinations.map(item => item.schedule);
      } else {
        return sortedCombinations
          .map(value => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value.schedule);
      }
    }
    const handleGenerateSchedule = () => {
      console.log("Selected Courses:", selectedCourses);
      
      // Assign unique colors to each course before generating schedules
      const assignColors = (courses) => {
        // Get all unique course codes
        const uniqueCourses = new Set();
        courses.forEach(course => {
          if (course.category === 'Science' && course.specificCourse) {
            // For science courses, use the full course code
            uniqueCourses.add(course.specificCourse.split('-').slice(0, -1).join('-'));
          } else if (course.category && course.group) {
            // For non-science courses, use category-group combination
            uniqueCourses.add(`${course.category}-${course.group}`);
          }
        });
    
        // Assign colors
        const newCourseColors = {};
        Array.from(uniqueCourses).forEach((courseId, index) => {
          newCourseColors[courseId] = colorPalette[index % colorPalette.length];
        });
    
        setCourseColors(newCourseColors);
        return newCourseColors;
      };
    
      const newColors = assignColors(selectedCourses);
      
      const schedules = generateScheduleCombinations(selectedCourses, sampleClasses, minimizeGaps);

      console.log("Generated Schedules:", schedules);
    
      // Add colors to each course in the schedules
      const coloredSchedules = schedules.map(schedule => 
        schedule.map(course => {
          let colorKey;
          if (course.category === 'Science') {
            colorKey = course.code;
          } else {
            colorKey = `${course.category}-${course.group}`;
          }
          return {
            ...course,
            color: newColors[colorKey] || colorPalette[0] // Fallback to first color if not found
          };
        })
      );
      
      setGeneratedSchedules(coloredSchedules);
      setCurrentScheduleIndex(0);
      setShowingGeneratedSchedules(true);
      if (coloredSchedules.length > 0) {
        setSelectedClasses(coloredSchedules[0]);
      } else {
        alert("No valid schedules found. Try selecting different courses.");
      }
    };
    // Filtering logic
    const filteredCourses = sampleClasses.filter(course => {
        const matchesSearch = (
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const matchesCategory = !selectedCategory || course.category === selectedCategory;
        const matchesGroup = !selectedGroup || course.group === selectedGroup;
        
        return matchesSearch && matchesCategory && matchesGroup;
      });
      const getCellContent = (day, time) => {
        const selectedClass = selectedClasses.find(classItem => 
          classItem.schedule.some(slot =>
            slot.days.includes(day) && 
            isTimeInRange(time, slot.time)
          )
        );
      
        const hoveredPreview = !selectedClass && hoveredClass?.schedule.some(slot =>
          slot.days.includes(day) && 
          isTimeInRange(time, slot.time)
        );
      
        const wouldConflict = hoveredClass && selectedClass && 
          hoveredClass.id !== selectedClass.id &&
          hoveredClass.schedule.some(slot =>
            slot.days.includes(day) && 
            isTimeInRange(time, slot.time)
          );
      
        return { selectedClass, hoveredPreview, wouldConflict };
      };
      const getRandomColor = () => {
        // Get colors currently in use by selected classes
        const currentlyUsedColors = new Set(selectedClasses.map(c => c.color));
        
        // Filter out colors that are currently in use
        const availableColors = colorPalette.filter(color => !currentlyUsedColors.has(color));
        
        if (availableColors.length === 0) {
          // If somehow all colors are used, create a unique identifier
          return colorPalette[selectedClasses.length % colorPalette.length];
        }
        
        // Pick a random color from available ones
        const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        return randomColor;
      };
      const toggleClass = (classItem) => {
        setSelectedClasses(prev => {
          const isCurrentlySelected = prev.some(c => c.id === classItem.id);
          if (isCurrentlySelected) {
            return prev.filter(c => c.id !== classItem.id);
          } else {
            const hasConflict = prev.some(existingClass => {
              return existingClass.schedule.some(existingSlot => 
                classItem.schedule.some(newSlot => {
                  const sharedDays = existingSlot.days.filter(day => 
                    newSlot.days.includes(day)
                  );
                  if (sharedDays.length === 0) return false;
      
                  const [newStart, newEnd] = newSlot.time.split(' - ');
                  const [existingStart, existingEnd] = existingSlot.time.split(' - ');
                  
                  const newStartIndex = timeToSlotIndex(newStart);
                  const newEndIndex = timeToSlotIndex(newEnd);
                  const existingStartIndex = timeToSlotIndex(existingStart);
                  const existingEndIndex = timeToSlotIndex(existingEnd);
      
                  return (newStartIndex < existingEndIndex && newEndIndex > existingStartIndex);
                })
              );
            });
      
            if (hasConflict) {
              alert('Time conflict: This class overlaps with another selected class');
              return prev;
            }
      
            // Assign a new random color
            const newColor = getRandomColor();
            return [...prev, { ...classItem, color: newColor }];
          }
        });
      };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900">
      {/* Top Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center h-16 px-4">
        <div className="flex items-center space-x-4">
            <Menu className="w-6 h-6 text-gray-400" />
            <span className="text-xl font-semibold text-white">
              Marianopolis Schedule Builder
              <span className="text-sm font-normal text-gray-400 ml-2">Alpha v1.0</span>
            </span>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-4">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        <div className="flex px-4 py-2 space-x-4 border-t border-gray-700 bg-gray-800/50">
          <span className="text-white">Winter 2025</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400">Selected: {selectedClasses.length} courses</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 p-4 space-x-4 overflow-hidden w-full">
        {/* Course List */}
        <div className="w-96 bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Available Courses</h2>
            <p className="text-sm text-gray-400 mt-1">Click to add to schedule</p>
          </div>
          
          {/* Search and Filters */}
          <div className="p-4 space-y-3 border-b border-gray-700">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="w-full bg-gray-700 text-gray-200 pl-9 pr-4 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-500 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
            <FilterDropdown 
                label="Any Category" 
                options={courseCategories}
                value={selectedCategory}
                onChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedGroup(""); // Reset the group when category changes
                }}
            />
            <FilterDropdown 
                label="Any Group" 
                options={groupedCategories[selectedCategory] || []}
                value={selectedGroup}
                onChange={setSelectedGroup}
            />
            </div>
          </div>

          {/* Course List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-3 space-y-2">
            {filteredCourses.map(course => (
            <div
                key={course.id}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border border-gray-700 ${
                selectedClasses.find(c => c.id === course.id)
                    ? course.color + ' ring-1 ring-white/20'
                    : 'hover:bg-gray-700'
                }`}
                onClick={() => toggleClass(course)}
                onMouseEnter={() => setHoveredClass(course)}
                onMouseLeave={() => setHoveredClass(null)}
            >
                <div className="flex justify-between items-start">
                <div>
                    <div className="font-medium text-white">{course.name}</div>
                    <div className="text-sm mt-1 text-gray-300">
                    <span className="font-semibold">{course.code}</span> - Section {course.section}
                    </div>
                    <div className="text-sm mt-1 text-gray-300">{course.instructor}</div>
                </div>
                <div className="text-xs text-gray-300">
                    {course.group}
                </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                {course.schedule.flatMap((slot, index) => 
                    slot.days.map((day, dayIndex) => (
                    <div key={`${index}-${dayIndex}`} className="inline-flex items-center">
                        <span className="px-2 py-1 bg-gray-700 rounded-l-md text-sm text-gray-200">
                        {day}
                        </span>
                        <span className="px-2 py-1 bg-gray-700 rounded-r-md text-sm text-gray-300 border-l border-gray-600">
                        {slot.time}
                        </span>
                    </div>
                    ))
                )}
                </div>
            </div>
            ))}
            </div>
          </div>
        </div>

{/* Schedule Grid */}
<div className="flex-1 bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-700">
  <div className="p-4 border-b border-gray-700">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-white">Weekly Schedule</h2>
        {minimizeGaps && showingGeneratedSchedules && (
          <div className="text-sm text-gray-400 mt-1">
            Gap Size: {calculateGapSize(selectedClasses)} time slots
          </div>
        )}
      </div>
      {showingGeneratedSchedules && generatedSchedules.length > 0 && (
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const newIndex = (currentScheduleIndex - 1 + generatedSchedules.length) % generatedSchedules.length;
              setCurrentScheduleIndex(newIndex);
              setSelectedClasses(generatedSchedules[newIndex]);
            }}
            className="p-2 text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-400">
            {currentScheduleIndex + 1} / {generatedSchedules.length}
          </span>
          <button
            onClick={() => {
              const newIndex = (currentScheduleIndex + 1) % generatedSchedules.length;
              setCurrentScheduleIndex(newIndex);
              setSelectedClasses(generatedSchedules[newIndex]);
            }}
            className="p-2 text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  </div>
        <div className="flex-1">
            <table className="w-full border-collapse">
            <colgroup>
                <col style={{ width: '80px' }} />
                {['M', 'T', 'W', 'R', 'F'].map((day, i) => (
                <col key={i} style={{ width: `${(100-10)/5}%` }} />
                ))}
            </colgroup>
            <thead className="sticky top-0 bg-gray-800 z-10">
                <tr>
                <th className="p-2 border-b border-r border-gray-700"></th>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <th key={day} className="p-2 border-b border-r border-gray-700 font-semibold text-gray-300">
                    <div className="text-center whitespace-nowrap overflow-hidden">
                        {day}
                    </div>
                    </th>
                ))}
                </tr>
            </thead>
            <tbody>
                    {Array.from({ length: 28 }, (_, i) => {
                        const hour = Math.floor(i / 2) + 8;
                        const minute = i % 2 === 0 ? '15' : '45';
                        const nextHour = i % 2 === 0 ? hour : (hour + 1);
                        const nextMinute = i % 2 === 0 ? '45' : '15';
                        const time = `${hour.toString().padStart(2, '0')}:${minute}-${nextHour.toString().padStart(2, '0')}:${nextMinute}`;
                        return (
                        <tr key={time}>
                    <td className="py-1 px-2 border-b border-r border-gray-700 font-medium text-sm text-gray-400 whitespace-nowrap sticky left-0 bg-gray-800">
                        {time}
                    </td>
                    {['M', 'T', 'W', 'R', 'F'].map((day, dayIndex) => {
                        const { selectedClass, hoveredPreview, wouldConflict } = getCellContent(day, time);
                        const isFirstRow = i === 0;
                        const isLastRow = i === 21;

                        let cellStyle = 'border-r border-gray-700';  // Always keep vertical borders
                        if (selectedClass) {
                            cellStyle = `${selectedClass.color} text-white border-r border-gray-700`;
                        } else if (hoveredPreview) {
                            cellStyle = 'bg-gray-600/50 border-r border-gray-700';
                            if (isFirstRow || !getCellContent(day, `${Math.floor((i-1)/2) + 8}:${(i-1)%2 === 0 ? '15' : '45'}`).hoveredPreview) {
                                cellStyle += ' border-t border-gray-700';
                            }
                            if (isLastRow || !getCellContent(day, `${Math.floor((i+1)/2) + 8}:${(i+1)%2 === 0 ? '15' : '45'}`).hoveredPreview) {
                                cellStyle += ' border-b border-gray-700';
                            }
                        } else {
                            cellStyle += ' border-b';
                        }

                        return (
                            <td
    key={`${day}-${time}`}
    style={{ height: '30.8px' }}
    className={`relative ${cellStyle}`}
    onMouseEnter={() => {
        if (selectedClass) {
            setHoveredCell(selectedClass.id);
        }
    }}
    onMouseLeave={() => setHoveredCell(null)}
>
    {selectedClass && (
        <>
            {/* Show class info in first cell */}
            {selectedClass.schedule.some(slot => {
                const [slotStart] = time.split('-');
                return slotStart === slot.time.split(' - ')[0] && 
                    slot.days.includes(day);
            }) && (
                <div className="absolute left-0 top-0 p-1 z-10 max-w-full">
                    <div className="text-xs font-medium line-clamp-2 overflow-hidden">{selectedClass.name}</div>
                    <div className="text-xs opacity-75 truncate">{selectedClass.instructor}</div>
                </div>
            )}
            {/* Show X button only in first cell when hovering */}
            {hoveredCell === selectedClass.id && 
             selectedClass.schedule.some(slot => {
                const [slotStart] = time.split('-');
                return slotStart === slot.time.split(' - ')[0] && 
                    slot.days.includes(day);
             }) && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClasses(current => 
                            current.filter(c => c.id !== selectedClass.id)
                        );
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-20"
                >
                    <X className="w-4 h-4 text-white" />
                </button>
            )}
        </>
    )}
    {wouldConflict && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
            <X className="w-4 h-4 text-red-500" />
        </div>
    )}
</td>
                        );
                    })}
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
        </div>
        {/* Automatic Scheduler Panel */}
        <div className="w-80 bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Automatic Scheduler</h2>
            <p className="text-sm text-gray-400 mt-1">Let us build your schedule</p>
          </div>
          
          {/* Course Selection */}
          <div className="p-4 flex flex-col space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Select Your Courses</h3>
              <p className="text-xs text-gray-400 mb-2">Select up to 7 courses</p>
              
              {/* Course Selection Fields - More Condensed */}
              {[...Array(7)].map((_, index) => {
  const selectedCategory = selectedCourses[index]?.category || '';
  const hasGroups = groupedCategories[selectedCategory];
  const selectedGroup = selectedCourses[index]?.group || '';
  
  // Get course options based on selected group
  const getCourseOptions = (group) => {
    if (group === '2024') {
      return [
        { value: 'cellbio', label: 'Cellular Biology' },
        { value: 'cellbio-enriched', label: 'ENRICHED - Cellular Biology' },
        { value: 'ecology', label: 'Ecology and Evolution' },
        { value: 'probstats', label: 'Probability and Statistics' },
        { value: 'diffcalc', label: 'Differential Calculus' },
        { value: 'diffcalc-fr', label: 'Calcul différentiel' },
        { value: 'intcalc', label: 'Integral Calculus' },
        { value: 'intcalc-enriched', label: 'ENRICHED - Integral Calculus' },
        { value: 'intcalc-fr', label: 'Calcul intégral' },
        { value: 'intcalc-fr-enriched', label: 'ENRICHED - Calcul intégral' },
        { value: 'genchem', label: 'General Chemistry' },
        { value: 'genchem-enriched', label: 'ENRICHED - General Chemistry' },
        { value: 'chemsolns', label: 'Chemistry of Solutions' },
        { value: 'mechanics', label: 'Mechanics' },
        { value: 'mechanics-enriched', label: 'ENRICHED - LIFE SCIENCES - Mechanics' },
        { value: 'mechanics-fr', label: 'Mécanique' },
        { value: 'programming', label: 'Programming in Science' }
      ];
    } else if (group === 'Pre-2024') {
      return [
        { value: 'linalg', label: 'Linear Algebra' },
        { value: 'linalg2', label: 'Linear Algebra II' },
        { value: 'intcalc', label: 'Integral Calculus' },
        { value: 'calc3', label: 'Calculus III' },
        { value: 'probstats', label: 'Probability and Statistics' },
        { value: 'finitemath', label: 'Finite Mathematics' },
        { value: 'em', label: 'Electricity and Magnetism' },
        { value: 'em-as', label: 'A&S - Electricity and Magnetism' },
        { value: 'em-enriched-mp', label: 'ENRICHED - MODERN PHYSICS - E & M' },
        { value: 'em-enriched-ls', label: 'ENRICHED - LIFE SCIENCES - E & M' },
        { value: 'waves', label: 'Waves, Light and Modern Physics' },
        { value: 'astro', label: 'Astrophysics' },
        { value: 'bio2', label: 'General Biology II' },
        { value: 'bio2-as', label: 'A&S - Biology II' },
        { value: 'orgchem', label: 'Organic Chemistry I' },
        { value: 'orgchem-as', label: 'A&S - Organic Chemistry' },
        { value: 'physiology', label: 'Human Physiology' },
        { value: 'compprog', label: 'Computer Programming' },
        { value: 'techdraw', label: 'Technical Drawing' },
        { value: 'progtechniques', label: 'Programming Techniques and Applications' }
      ];
    }
    return [];
  };

  return (
    <div key={index} className="mb-2">
      <div className="grid grid-cols-7 gap-1 items-start mb-1">
        <div className="text-xs text-gray-400 col-span-1">{index + 1}.</div>
        <div className="col-span-3">
          <select 
            value={selectedCategory}
            onChange={(e) => {
              const newCourses = [...selectedCourses];
              newCourses[index] = { category: e.target.value, group: '', specificCourse: '' };
              setSelectedCourses(newCourses);
            }}
            className="w-full bg-gray-700 text-gray-200 py-1 px-2 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-500 text-xs"
          >
            <option value="">Category</option>
            {courseCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="col-span-3">
          <select 
            value={selectedCourses[index]?.group || ''}
            onChange={(e) => {
              const newCourses = [...selectedCourses];
              newCourses[index] = { 
                ...newCourses[index], 
                group: e.target.value,
                specificCourse: '' 
              };
              setSelectedCourses(newCourses);
            }}
            disabled={!selectedCategory}
            className="w-full bg-gray-700 text-gray-200 py-1 px-2 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-500 text-xs"
          >
            <option value="">{hasGroups ? "Group" : "None"}</option>
            {hasGroups && groupedCategories[selectedCategory].map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedCategory === 'Science' && selectedCourses[index]?.group && (
  <div className="grid grid-cols-7 gap-1">
    <div className="col-span-1"></div>
    <select 
      value={selectedCourses[index]?.specificCourse || ''}
      onChange={(e) => {
        const newCourses = [...selectedCourses];
        newCourses[index] = { 
          ...newCourses[index], 
          specificCourse: e.target.value 
        };
        setSelectedCourses(newCourses);
      }}
      className="col-span-6 bg-gray-700 text-gray-200 py-1 px-2 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-500 text-xs"
    >
      <option value="">Select Course</option>
      {sampleClasses
        .filter(course => 
          course.category === 'Science' && 
          course.group === selectedCourses[index]?.group
        )
        .map(course => ({
          ...course,
          displayName: identifyCourse(course.code, course.section)
        }))
        .filter((course, index, self) => 
          index === self.findIndex(t => t.displayName === course.displayName)
        )
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map(course => (
          <option key={course.id} value={course.code + '-' + course.section}>
            {course.displayName}
          </option>
        ))}
    </select>
  </div>
)}
    </div>
  );
})}

              {/* Preferences */}
              <div className="pt-3 space-y-4 border-t border-gray-700 mt-3">
                <h3 className="text-sm font-medium text-gray-300">Preferences</h3>
                
                {/* Minimize Gaps */}
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox"
                    checked={minimizeGaps}
                    onChange={(e) => setMinimizeGaps(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-600 bg-gray-700"
                  />
                  <span className="text-sm text-gray-300">Minimize gaps between classes</span>
                </label>

                  {/* Free Days Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Minimum free days</span>
                      <span className="text-sm text-gray-400">{minFreeDays}</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="2"
                      value={minFreeDays}
                      onChange={(e) => setMinFreeDays(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                {/* No Early Starts */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      checked={noEarlyStarts}
                      onChange={(e) => setNoEarlyStarts(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-gray-300">No early starts</span>
                  </label>
                  <div className="relative group">
                    <div className="cursor-help text-gray-400">?</div>
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-300 pointer-events-none">
                      Classes won't start before 10:15 AM
                    </div>
                  </div>
                </div>

                {/* No Late Ends */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      checked={noLateEnds}
                      onChange={(e) => setNoLateEnds(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-600 bg-gray-700"
                    />
                    <span className="text-sm text-gray-300">No late ends</span>
                  </label>
                  <div className="relative group">
                    <div className="cursor-help text-gray-400">?</div>
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-300 pointer-events-none">
                      Classes won't end after 4:15 PM
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button 
                onClick={handleGenerateSchedule}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                disabled={!selectedCourses.some(course => course.category && course.group)}
              >
                Generate Schedule
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.5);
        }
      `}</style>
    </div>
  );
};

export default ScheduleBuilder;