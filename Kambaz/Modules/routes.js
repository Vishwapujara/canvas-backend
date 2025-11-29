import ModulesDao from "./dao.js";
export default function ModulesRoutes(app, db) {
    // Note: The DAO constructor will ignore 'db' and use the Mongoose model
    const dao = ModulesDao(db); 
    
    // REFACTORED: findModulesForCourse
    const findModulesForCourse = async (req, res) => {
        const { courseId } = req.params;
        const modules = await dao.findModulesForCourse(courseId); 
        res.json(modules);
    }
    
    // REFACTORED: createModuleForCourse
    const createModuleForCourse = async (req, res) => {
        const { courseId } = req.params;
        const module = {
            ...req.body,
        };
        // DAO now takes courseId and module body
        const newModule = await dao.createModule(courseId, module); 
        res.send(newModule);
    }
    
    // REFACTORED: deleteModule - Path now includes :courseId, DAO call updated
    const deleteModule = async (req, res) => {
        const { courseId, moduleId } = req.params; // Extract both IDs
        const status = await dao.deleteModule(courseId, moduleId); // Pass both IDs
        res.send(status);
    }
    // Update mapping to include courseId
    app.delete("/api/courses/:courseId/modules/:moduleId", deleteModule);

    // REFACTORED: updateModule - Path now includes :courseId, DAO call updated
    const updateModule = async (req, res) => {
        const { courseId, moduleId } = req.params; // Extract both IDs
        const moduleUpdates = req.body;
        // DAO now takes courseId, moduleId, and updates
        const updatedModule = await dao.updateModule(courseId, moduleId, moduleUpdates); 
        res.send(updatedModule);
    }
    // Update mapping to include courseId
    app.put("/api/courses/:courseId/modules/:moduleId", updateModule);


    // Existing routes (keep original name but ensure correct implementation)
    app.post("/api/courses/:courseId/modules", createModuleForCourse);
    app.get("/api/courses/:courseId/modules", findModulesForCourse);
}