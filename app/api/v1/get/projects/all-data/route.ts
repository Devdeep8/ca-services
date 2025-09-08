// / /app/api/projects/route.ts - Main projects API
import { NextRequest, NextResponse } from "next/server";
import { projectService } from "@/services/project-service/get-project-data.service";

export async function GET(req: NextRequest) {
    try {
        // Validate the API key
        const validate = req.headers.get('Authorization');
        if (validate !== process.env.API_KEY) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Extract query parameters from URL
        const { searchParams } = new URL(req.url);
        
        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

        // Sorting parameters
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortDirection = searchParams.get('sortDirection') || 'desc';

        // Filter parameters
        const status = searchParams.get('status');
        const userId = searchParams.get('userId');
        const categoryId = searchParams.get('categoryId');
        const isActive = searchParams.get('isActive');
        const search = searchParams.get('search');
        const includeRelations = searchParams.get('includeRelations') === 'true';

        // Date range filters
        const createdAfter = searchParams.get('createdAfter');
        const createdBefore = searchParams.get('createdBefore');

        // Build filters object
        const filters: any = {};
        if (status) filters.status = status;
        if (userId) filters.userId = userId;
        if (categoryId) filters.categoryId = categoryId;
        if (isActive !== null) filters.isActive = isActive === 'true';
        if (search) filters.search = search;

        // Add date range filters
        if (createdAfter || createdBefore) {
            filters.createdAt = {};
            if (createdAfter) filters.createdAt.gte = new Date(createdAfter);
            if (createdBefore) filters.createdAt.lte = new Date(createdBefore);
        }

        // Build pagination object
        const pagination: any = {
            page,
            limit,
        };
        if (offset !== undefined) pagination.offset = offset;

        // Build sorting object
        const sort: any = {
            field: sortBy as any,
            direction: sortDirection as 'asc' | 'desc',
        };

        // Call the service
        const result = await projectService.getAllProjects(
            filters,
            pagination,
            sort,
            includeRelations
        );

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error,
                    message: result.message
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
            message: result.message,
            meta: result.meta,
            // Additional pagination info for frontend
            pagination: {
                currentPage: result.meta?.page,
                totalPages: result.meta?.totalPages,
                totalItems: result.meta?.total,
                itemsPerPage: result.meta?.limit,
                hasNextPage: (result.meta?.page || 1) < (result.meta?.totalPages || 1),
                hasPrevPage: (result.meta?.page || 1) > 1,
            }
        });

    } catch (error) {
        console.log('API Error:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: error instanceof Error ? error.message : 'Internal server error',
                error: 'Internal server error'
            },
            { status: 500 }
        );
    }
}